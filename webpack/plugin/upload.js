/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.upload
 *
 * Uses 'plink' and 'pscp' from PuTTY package: https://www.putty.org
 *
 * !!! For first time build on fresh os install:
 * !!!   - create the environment variables WPBUILD_APP1_SSH_AUTH_*
 * !!!   - run a plink command manually to generate and trust the fingerprints:
 * !!!       plink -ssh -batch -pw <PWD> smeesseman@app1.spmeesseman.com "echo hello"
 *
 */

const { join, basename } = require("path");
const globalEnv = require("../utils/global");
const { spawnSync } = require("child_process");
const { initGlobalEnvObject } = require("../utils/utils");
const { writeInfo, figures, withColor, colors } = require("../utils/console");
const { renameSync, copyFileSync, mkdirSync, existsSync, rmSync, readdirSync } = require("fs");
const { WebpackError } = require("webpack");
const { info } = require("console");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackHashState} WebpackHashState */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function upload
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined} plugin instance
 */
const upload = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        initGlobalEnvObject("upload", 0, "callCount", "readyCount");
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.afterDone.tap("AfterDoneUploadPlugin", (statsData) =>
                {
                    if (statsData.hasErrors()) {
                        return;
                    }
                    const stats = statsData.toJson(),
                          assets = stats.assets?.filter(a => a.type === "asset");
                    ++globalEnv.upload.callCount;
                    if (assets) {
                        uploadAssets(assets, env);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @function uploadAssets
 * @param {WebpackStatsAsset[]} assets
 * @param {WebpackEnvironment} env
 * @throws {WebpackError}
 */
const uploadAssets = (assets, env) =>
{   //
    // `The lBasePath` variable is a temp directory that we will create in the in
    // the OS/env temp dir.  We will move only files that have changed content there,
    // and perform only one upload when all builds have completed.
    //
    const toUploadPath = join(env.paths.temp, env.environment);

    if (globalEnv.upload.callCount === 1)
    {
        if (!existsSync(toUploadPath)) { mkdirSync(toUploadPath); }
        copyFileSync(join(env.paths.build, "node_modules", "source-map", "lib", "mappings.wasm"), join(toUploadPath, "mappings.wasm"));
    }

    assets.filter(a => !!a.chunkNames && a.chunkNames.length > 0).forEach((a) =>
    {
        const chunkName = /** @type {string}*/(/** @type {string[]}*/(a.chunkNames)[0]);
        if (env.state.hash.next[chunkName] !== env.state.hash.current[chunkName] && a.info.related)
        {
            const distPath = env.buildMode === "release" ? env.paths.dist : env.paths.temp;
            copyFileSync(join(distPath, a.name), join(toUploadPath, a.name));
            if (a.info.related.sourceMap)
            {
                const fileNameSourceMap = a.info.related.sourceMap.toString();
                if (env.environment === "prod") {
                    renameSync(join(distPath, fileNameSourceMap), join(toUploadPath, fileNameSourceMap));
                }
                else {
                    copyFileSync(join(distPath, fileNameSourceMap), join(toUploadPath, fileNameSourceMap));
                }
            }
            ++globalEnv.upload.readyCount;
        }
        else {
            const fileNameNoHash = a.name.replace(`.${a.info.contenthash}`, "");
            writeInfo(`resource '${chunkName}|${fileNameNoHash}' unchanged, skip upload [${a.info.contenthash}]`, withColor(figures.info, colors.yellow));
        }
    });

    if (globalEnv.upload.callCount === 2 && globalEnv.upload.readyCount > 0)
    {
        const host = process.env.WPBUILD_APP1_SSH_UPLOAD_HOST,
              user = process.env.WPBUILD_APP1_SSH_UPLOAD_USER,
              rBasePath = process.env.WPBUILD_APP1_SSH_UPLOAD_PATH,
              /** @type {import("child_process").SpawnSyncOptions} */
              spawnSyncOpts = { cwd: env.paths.build, encoding: "utf8", shell: true },
              sshAuth = process.env.WPBUILD_APP1_SSH_UPLOAD_AUTH,
              sshAuthFlag = process.env.WPBUILD_APP1_SSH_UPLOAD_FLAG,
              filesToUpload = readdirSync(toUploadPath);

        if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag) {
            throw new WebpackError("Required environment variables for upload are not set");
        }

        if (filesToUpload.length !== globalEnv.upload.readyCount) {
            writeInfo("stored resource count does not match upload directory file count", colors.warning);
        }

        const plinkCmds = [
            `mkdir ${rBasePath}/${env.app.name}`,
            `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}`,
            `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}`,
            `rm -f ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}/*.*`
        ];
        if (env.environment === "prod") { plinkCmds.pop(); }

        const plinkArgs = [
            "-ssh",       // force use of ssh protocol
            "-batch",     // disable all interactive prompts
            sshAuthFlag,  // auth flag
            sshAuth,      // auth key
            `${user}@${host}`,
            plinkCmds.join(";")
        ];

        const pscpArgs = [
            sshAuthFlag,  // auth flag
            sshAuth,      // auth key
            "-q",         // quiet, don't show statistics
            "-r",         // copy directories recursively
            toUploadPath, // directory containing the files to upload, the "directpory" itself (prod/dev/test) will be
            `${user}@${host}:"${rBasePath}/${env.app.name}/v${env.app.version}"` // uploaded, and created if not exists
        ];

        writeInfo(`${figures.color.star } ${withColor(`upload resource files to ${host}`, colors.grey)}`);
        try {
            writeInfo(`   create / clear dir    : plink ${plinkArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`, null);
            spawnSync("plink", plinkArgs, spawnSyncOpts);
            writeInfo(`   upload files  : pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`, null);
            spawnSync("pscp", pscpArgs, spawnSyncOpts);
            filesToUpload.forEach((f) =>
                writeInfo(`   ${figures.color.up} ${withColor(basename(f).padEnd(30), colors.grey)} ${figures.color.successTag}`, null)
            );
            writeInfo(`${figures.color.star} ${withColor("successfully uploaded resource files", colors.grey)}`, null);
        }
        catch (e) {
            writeInfo("error uploading resource files:", figures.color.error);
            filesToUpload.forEach(f => writeInfo(`   ${withColor(figures.up, colors.red)} ${withColor(basename(f), colors.grey)}`, figures.color.error));
            writeInfo(e.message.trim(), figures.color.error, "   ");
        }
        finally {
            rmSync(toUploadPath, { recursive: true, force: true });
        }
    }
};


module.exports = upload;

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.upload
 *
 * Uses 'plink' and 'pscp' from PuTTY package: https://www.putty.org
 *
 * !!! For first time build on fresh os install:
 * !!!   - create the environment variable SPMEESSEMAN_COM_APP1_SSH_AUTH_SMEESSEMAN
 * !!!   - run a plink command manually to generate and trust the fingerprints:
 * !!!       plink -ssh -batch -pw <PWD> smeesseman@app1.spmeesseman.com "echo hello"
 *
 */

const { join } = require("path");
const globalEnv = require("../global");
const { spawnSync } = require("child_process");
const { initGlobalEnvObject } = require("../utils");
const { writeInfo, figures, withColor, colors } = require("../console");
const { renameSync, copyFileSync, mkdirSync, existsSync, rmSync } = require("fs");

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
 */
const uploadAssets = (assets, env) =>
{   //
    // `The lBasePath` variable is a temp directory that we will create in the in
    // the OS/env temp dir.  We will move only files that have changed content there,
    // and perform only one upload when all builds have completed.
    //
    const lBasePath = join(env.paths.temp, env.environment);

    if (globalEnv.upload.callCount === 1)
    {
        if (!existsSync(lBasePath)) { mkdirSync(lBasePath); }
        copyFileSync(join(env.paths.build, "node_modules", "source-map", "lib", "mappings.wasm"), join(lBasePath, "mappings.wasm"));
    }

    assets.filter(a => !!a.chunkNames && a.chunkNames.length > 0).forEach((a) =>
    {
        const chunkName = /** @type {string}*/(/** @type {string[]}*/(a.chunkNames)[0]);
        if (env.state.hash.next[chunkName] !== env.state.hash.current[chunkName] && a.info.related)
        {
            const fileNameNoHash = a.name.replace(`.${a.info.contenthash}`, ""),
                  fileNameSourceMap = a.info.related.sourceMap.toString(),
                  distPath = env.buildMode === "release" ? env.paths.dist : env.paths.temp;
            copyFileSync(join(distPath, a.name), join(lBasePath, fileNameNoHash));
            if (env.environment === "prod") {
                renameSync(join(distPath, fileNameSourceMap), join(lBasePath, fileNameSourceMap));
            }
            else {
                copyFileSync(join(distPath, fileNameSourceMap), join(lBasePath, fileNameSourceMap));
            }
            ++globalEnv.upload.readyCount;
        }
        else {
            writeInfo(`${figures.color.star} ${withColor(`content in resource ${chunkName} unchanged, skip upload`, colors.grey)}`);
        }
    });

    if (globalEnv.upload.callCount === 2 && globalEnv.upload.readyCount > 0)
    {
        const host = "app1.spmeesseman.com",
              user = "smeesseman",
              rBasePath = "/var/www/app1/res/app",
              /** @type {import("child_process").SpawnSyncOptions} */
              spawnSyncOpts = { cwd: env.paths.build, encoding: "utf8", shell: true },
              sshAuth = process.env.SPMEESSEMAN_COM_APP1_SSH_AUTH_SMEESSEMAN || "InvalidAuth";

        const plinkArgs = [
            "-ssh",   // force use of ssh protocol
            "-batch", // disable all interactive prompts
            "-pw",    // authenticate
            sshAuth,  // auth key
            `${user}@${host}`
        ];

        const pscpArgs = [
            "-pw",    // authenticate
            sshAuth,  // auth key
            // "-q",  // quiet, don't show statistics
            "-r",     // copy directories recursively
            lBasePath,
            `${user}@${host}:"${rBasePath}/${env.app.name}/v${env.app.version}"`
        ];

        writeInfo(`${figures.color.star } ${withColor(`upload resource files to ${host}`, colors.grey)}`);
        try {
            const plinkArgsFull = [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}` ];
            writeInfo(`   create dir    : plink ${plinkArgsFull.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
            spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}` ], spawnSyncOpts);
            spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}` ], spawnSyncOpts);
            spawnSync("plink", plinkArgsFull, spawnSyncOpts);
            writeInfo(`   upload files  : pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`);
            spawnSync("pscp", pscpArgs, spawnSyncOpts);
            writeInfo(`${figures.color.star} ${withColor("successfully uploaded resource files", colors.grey)}`);
        }
        catch (e) {
            writeInfo("error uploading resource files:", figures.color.error);
            writeInfo("   " + e.message.trim(), figures.color.error);
        }
        finally {
            rmSync(lBasePath, { recursive: true, force: true });
        }
    }
};


module.exports = upload;

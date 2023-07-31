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
const { WebpackError } = require("webpack");
const WpBuildBasePlugin = require("./base");
const { spawnSync } = require("child_process");
const { mkdirSync, existsSync } = require("fs");
const { globalEnv } = require("../utils/global");
const { copyFile, rm, readdir, rename } = require("fs/promises");
const { writeInfo, figures, withColor, colors } = require("../utils/console");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildHashState} WpBuildHashState */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


class WpBuildUploadPlugin extends WpBuildBasePlugin
{
    /**
     * @class WpBuildLicenseFilePlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.initGlobalEnvObject("upload", 0, "callCount", "readyCount");
    }

    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		this.onApply(compiler);
        compiler.hooks.done.tapPromise("AfterDoneUploadPlugin", async (statsData) =>
        {
            if (statsData.hasErrors()) {
                return;
            }
            const stats = statsData.toJson(),
                    assets = stats.assets?.filter(a => a.type === "asset");
            ++globalEnv.upload.callCount;
            if (assets) {
                await this.uploadAssets(assets);
            }
        });
    }

    /**
     * @function
     * @private
     * @param {WebpackStatsAsset[]} assets
     * @throws {WebpackError}
     */
    async uploadAssets(assets)
    {   //
        // `The lBasePath` variable is a temp directory that we will create in the in
        // the OS/env temp dir.  We will move only files that have changed content there,
        // and perform only one upload when all builds have completed.
        //
        const env = this.options.env,
              toUploadPath = join(env.paths.temp, env.environment);

        if (globalEnv.upload.callCount === 1)
        {
            if (!existsSync(toUploadPath)) { mkdirSync(toUploadPath); }
            await copyFile(join(env.paths.build, "node_modules", "source-map", "lib", "mappings.wasm"), join(toUploadPath, "mappings.wasm"));
        }

        for (const a of assets.filter(a => !!a.chunkNames && a.chunkNames.length > 0))
        {
            const chunkName = /** @type {string}*/(/** @type {string[]}*/(a.chunkNames)[0]);
            if (env.state.hash.next[chunkName] !== env.state.hash.current[chunkName] && a.info.related)
            {
                await copyFile(join(env.paths.dist, a.name), join(toUploadPath, a.name));
                if (a.info.related.sourceMap)
                {
                    const fileNameSourceMap = a.info.related.sourceMap.toString();
                    if (env.environment === "prod") {
                        await rename(join(env.paths.dist, fileNameSourceMap), join(toUploadPath, fileNameSourceMap));
                    }
                    else {
                        await copyFile(join(env.paths.dist, fileNameSourceMap), join(toUploadPath, fileNameSourceMap));
                    }
                }
                ++globalEnv.upload.readyCount;
            }
            else {
                const fileNameNoHash = a.name.replace(`.${a.info.contenthash}`, "");
                writeInfo(
                    `resource '${chunkName}|${fileNameNoHash}' unchanged, skip upload [${a.info.contenthash}]`,
                    withColor(figures.info, colors.yellow)
                );
            }
        }

        if (globalEnv.upload.callCount === 2 && globalEnv.upload.readyCount > 0)
        {
            const host = process.env.WPBUILD_APP1_SSH_UPLOAD_HOST,
                  user = process.env.WPBUILD_APP1_SSH_UPLOAD_USER,
                  rBasePath = process.env.WPBUILD_APP1_SSH_UPLOAD_PATH,
                  /** @type {import("child_process").SpawnSyncOptions} */
                  spawnSyncOpts = { cwd: env.paths.build, encoding: "utf8", shell: true },
                  sshAuth = process.env.WPBUILD_APP1_SSH_UPLOAD_AUTH,
                  sshAuthFlag = process.env.WPBUILD_APP1_SSH_UPLOAD_FLAG,
                  filesToUpload = await readdir(toUploadPath);

            if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag) {
                // compilation.errors.push(new WebpackError("Required environment variables for upload are not set"));
                // return;
                throw new WebpackError("Required environment variables for upload are not set");
            }

            if (filesToUpload.length !== globalEnv.upload.readyCount) {
                writeInfo("stored resource count does not match upload directory file count", figures.colors.warning);
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
                writeInfo(`   create / clear dir    : plink ${plinkArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
                spawnSync("plink", plinkArgs, spawnSyncOpts);
                writeInfo(`   upload files  : pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`);
                spawnSync("pscp", pscpArgs, spawnSyncOpts);
                filesToUpload.forEach((f) =>
                    writeInfo(`   ${figures.color.up} ${withColor(basename(f).padEnd(env.app.logPad.plugin.upload.fileList), colors.grey)} ${figures.color.successTag}`)
                );
                writeInfo(`${figures.color.star} ${withColor("successfully uploaded resource files", colors.grey)}`);
            }
            catch (e) {
                writeInfo("error uploading resource files:", figures.color.error);
                filesToUpload.forEach(f => writeInfo(`   ${withColor(figures.up, colors.red)} ${withColor(basename(f), colors.grey)}`, figures.color.error));
                writeInfo(e.message.trim(), figures.color.error, "   ");
            }
            finally {
                await rm(toUploadPath, { recursive: true, force: true });
            }
        }
    }

}


/**
 * @function upload
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WpBuildUploadPlugin | undefined} plugin instance
 */
const upload = (env, wpConfig) =>
{
    if (env.app.plugins.upload !== false && env.build === "extension")
    {
        return new WpBuildUploadPlugin({ env, wpConfig });
    }
};


module.exports = upload;

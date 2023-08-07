/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.upload
 * !!! This module uses 'plink' and 'pscp' from the PuTTY package: https://www.putty.org
 * !!! For first time build on fresh os install:
 * !!!   - create the environment variables WPBUILD_APP1_SSH_AUTH_*
 * !!!   - run a plink command manually to generate and trust the fingerprints:
 * !!!       plink -ssh -batch -pw <PWD> smeesseman@app1.spmeesseman.com "echo hello"
 */

const { existsSync } = require("fs");
const { join, basename } = require("path");
const { WebpackError } = require("webpack");
const WpBuildBasePlugin = require("./base");
const { spawnSync } = require("child_process");
const { copyFile, rm, readdir, rename, mkdir } = require("fs/promises");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
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
     * @function Called by webpack runtime to initialize this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            uploadDebugSupportFiles: {
                async: true,
                hook: "afterEmit",
                callback: this.debugSupportFiles.bind(this)
            }
        });
    }

    /**
     * @function
     * @private
     * @param {WebpackCompilation} compilation
     * @throws {WebpackError}
     */
    async debugSupportFiles(compilation)
    {   //
        // `The lBasePath` variable is a temp directory that we will create in the in
        // the OS/env temp dir.  We will move only files that have changed content there,
        // and perform only one upload when all builds have completed.
        //
        const env = this.env,
              logger = env.logger,
              toUploadPath = join(env.paths.temp, env.environment), // /temp/<env>/<env>
              logIcon = logger.withColor(logger.icons.info, logger.colors.yellow);

        logger.write("upload debug support files", 1, "", logIcon);
        this.compilation = compilation;
        if (!existsSync(toUploadPath)) {
            await mkdir(toUploadPath);
        }

        for (const chunk of Array.from(compilation.chunks).filter(c => c.canBeInitial()))
        {
            for (const file of Array.from(chunk.files).filter(f => this.matchObject(f)))
            {
                const asset = compilation.getAsset(file);
                if (asset && chunk.name && (env.state.hash.next[chunk.name] !== env.state.hash.current[chunk.name] || !env.state.hash.previous[chunk.name]))
                {
                    logger.value("   queue asset for upload", logger.tag(file), 2, "", logIcon);
                    logger.value("      asset info", JSON.stringify(asset.info), 4);
                    await copyFile(join(env.paths.dist, file), join(toUploadPath, file));
                    if (asset.info.related?.sourceMap)
                    {
                        const sourceMapFile = asset.info.related.sourceMap.toString();
                        logger.value("   queue sourcemap for upload", logger.tag(sourceMapFile), 2, "", logIcon);
                        if (env.environment === "prod") {
                            logger.value("   remove production sourcemap from distribution", sourceMapFile, 3);
                            await rename(join(env.paths.dist, sourceMapFile), join(toUploadPath, sourceMapFile));
                        }
                        else {
                            await copyFile(join(env.paths.dist, sourceMapFile), join(toUploadPath, sourceMapFile));
                        }
                    }
                }
                else if (asset)
                {
                    const msg = "   unchanged, skip upload",
                          hash = asset.info.contenthash?.toString() || "";
                    logger.value(msg, logger.tag(hash) + " " + logger.tag(file), 2, "", logIcon);
                }
            }
        }

        const host = process.env.WPBUILD_APP1_SSH_UPLOAD_HOST,
              user = process.env.WPBUILD_APP1_SSH_UPLOAD_USER,
              rBasePath = process.env.WPBUILD_APP1_SSH_UPLOAD_PATH,
              /** @type {import("child_process").SpawnSyncOptions} */
              spawnSyncOpts = { cwd: env.paths.build, encoding: "utf8", shell: true },
              sshAuth = process.env.WPBUILD_APP1_SSH_UPLOAD_AUTH,
              sshAuthFlag = process.env.WPBUILD_APP1_SSH_UPLOAD_FLAG,
              filesToUpload = await readdir(toUploadPath);

        if (filesToUpload.length === 0) {
            logger.write("no assets to upload", 1, "", logIcon);
            return;
        }

        if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag)
        {
            this.compilation.errors.push(new WebpackError("Required environment variables for upload are not set"));
            return;
        }

        const plinkCmds = [
            `mkdir ${rBasePath}/${env.app.name}`,
            `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}`,
            `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}`,
            // `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}/${compilation.hash}`,
            `rm -f ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}/*.*`,
            // `rm -f ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}/${compilation.hash}/*.*`
        ];
        if (env.environment !== "prod") { plinkCmds.pop(); }

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

        await copyFile(join(env.paths.build, "node_modules", "source-map", "lib", "mappings.wasm"), join(toUploadPath, "mappings.wasm"));

        logger.write(`   upload resource files to ${host}`, 1, "", logIcon);
        try
        {
            logger.write("   plink: create / clear remmote directory", 1, "", logIcon);
            // logger.write("  plink ${plinkArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`, 5, "", logIcon);
            spawnSync("plink", plinkArgs, spawnSyncOpts);
            logger.write("   pscp:  upload files", 1, "", logIcon);
            // logger.write("  pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`, 5, "", logIcon);
            spawnSync("pscp", pscpArgs, spawnSyncOpts);
            filesToUpload.forEach((f) =>
                logger.write(`   ${logger.icons.color.successTag} ${logger.withColor(`uploaded ${basename(f)}`, logger.colors.grey)}`, 1, "", logIcon)
            );
            logger.write("successfully uploaded resource files", 1, "", logIcon);
        }
        catch (e)
        {
            logger.error("error uploading resource files:");
            filesToUpload.forEach((f) =>
                logger.write(`   ${logger.icons.color.errorTag} ${logger.withColor(`upload ${basename(f)} failed`, logger.colors.grey)}`, 1, "", logIcon)
            );
            logger.error(e);
        }
        finally {
            await rm(toUploadPath, { recursive: true, force: true });
        }
    }

}


/**
 * @function upload
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildUploadPlugin | undefined} plugin instance
 */
const upload = (env) =>
    (env.app.plugins.upload !== false && env.isExtension ? new WpBuildUploadPlugin({ env }) : undefined);


module.exports = upload;

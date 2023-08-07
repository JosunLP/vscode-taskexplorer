/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/scm.js
 * @author Scott Meesseman
 */

const { globalEnv } = require("../utils");
const WpBuildBasePlugin = require("./base");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


class WpBuildScmPlugin extends WpBuildBasePlugin
{
    /**
     * @class WpBuildLicenseFilePlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options, "scm"); }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            commitSourceCodeChanges: {
                async: true,
                hook: "shutdown",
                callback: this.commit.bind(this)
            }
        });
    }


    /**
     * @function uploadAssets
     */
    async commit()
    {
        if (globalEnv.scm.callCount === 2 && globalEnv.scm.readyCount > 0)
        {
            const logger = this.env.logger,
                  provider = process.env.WPBUILD_SCM_PROVIDER || "git",
                  host = process.env.WPBUILD_SCM_HOST,
                  user = process.env.WPBUILD_SCM_USER; // ,
                  // /** @type {import("child_process").SpawnSyncOptions} */
                  // spawnSyncOpts = { cwd: env.paths.build, encoding: "utf8", shell: true },
                  // sshAuth = process.env.WPBUILD_SCM_AUTH || "InvalidAuth";

            const scmArgs = [
                "ci",    // authenticate
                // sshAuth,  // auth key
                // "-q",  // quiet, don't show statistics
                "-r",     // copy directories recursively
                `${user}@${host}:${this.env.app.name}/v${this.env.app.version}"`
            ];
            logger.write(`${logger.icons.color.star } ${logger.withColor(`check in resource files to ${host}`, logger.colors.grey)}`);
            try {
                logger.write(`   full scm command      : ${provider} ${scmArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
                //
                // TODO - check in any project-info files that were copied
                //        -*-and-*- package.json if we add content hash to "main" file name???
                //
                // spawnSync(provider, scmArgs, spawnSyncOpts);
                logger.write(`${logger.icons.color.star} ${logger.withColor("successfully checked in resource files", logger.colors.grey)}`);
            }
            catch (e) {
                logger.error(`error checking in resource files: ${e.message}`);
            }
        }
    };

}


/**
 * @function finalize
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildScmPlugin | undefined}
 */
const scm = (env) =>
    (env.app.plugins.scm !== false && env.isExtensionProd ? new WpBuildScmPlugin({ env }) : undefined);


module.exports = scm;

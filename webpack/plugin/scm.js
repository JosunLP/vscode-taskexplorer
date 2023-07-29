/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.banner
 */

const globalEnv = require("../utils/global");
const { spawnSync } = require("child_process");
const { writeInfo, figures, withColor, colors } = require("../utils/console");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function finalize
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const scm = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.app.plugins.scm && env.build === "extension" && env.environment === "prod")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.shutdown.tapPromise("ScmShutdownPlugin", async () =>
                {
                    checkin(env);
                });
            }
        };
    }
    return plugin;
};


/**
 * @function uploadAssets
 * @param {WebpackEnvironment} env
 */
const checkin = (env) =>
{
    if (globalEnv.upload.callCount === 2 && globalEnv.upload.readyCount > 0)
    {
        const provider = process.env.WPBUILD_SCM_PROVIDER || "git",
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
            `${user}@${host}:${env.app.name}/v${env.app.version}"`
        ];

        writeInfo(`${figures.color.star } ${withColor(`check in resource files to ${host}`, colors.grey)}`);
        try {
            writeInfo(`   full scm command      : ${provider} ${scmArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
            //
            // TODO - check in any project-info files that were copied
            //        -*-and-*- package.json if we add content hash to "main" file name???
            //
            // spawnSync(provider, scmArgs, spawnSyncOpts);
            writeInfo(`${figures.color.star} ${withColor("successfully checked in resource files", colors.grey)}`);
        }
        catch (e) {
            writeInfo("error checking in resource files", figures.color.error);
            writeInfo("   " + e.message.trim(), figures.color.error);
        }
    }
};


module.exports = scm;

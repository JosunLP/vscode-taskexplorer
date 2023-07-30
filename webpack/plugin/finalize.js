/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.finalize
 */

const { join } = require("path");
const { asArray } = require("..//utils/utils");
const { rename, unlink, readdir } = require("fs/promises");
const { existsSync, copyFileSync, readdirSync } = require("fs");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function finalize
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const finalize = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.app.plugins.finalize !== false && env.build === "extension")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.shutdown.tapPromise("FinalizeShutdownPlugin", async () =>
                {
                    if (env.environment === "prod")
                    {
                        await licenseFiles(env);
                    }
                });
            }
        };
    }
    return plugin;
};



/**
 * @function licenseFiles
 * @param {WpBuildEnvironment} env
 * @returns {Promise<void>}
 */
const licenseFiles = async (env) =>
{
    const distPath = env.paths.distBuild,
          items = existsSync(distPath) ? await readdir(distPath) : [];
    for (const file of items.filter(i => i.includes("LICENSE")))
    {
        try {
            if (!file.includes(".debug")) {
                await rename(join(distPath, file), join(distPath, file.replace("js.LICENSE.txt", "LICENSE")));
            }
            else {
                await unlink(join(distPath, file));
            }
        } catch {}
    }
};


module.exports = finalize;

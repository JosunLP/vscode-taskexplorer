/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.asset
 */

const { join } = require("path");
const { readdirSync } = require("fs");
const { rename, unlink } = require("fs/promises");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method beforeemit
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const finalize = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        plugin =
        {
            apply: (compiler) => {
                compiler.hooks.shutdown.tapPromise("FinalizeShutdownPlugin", () => licenseFiles(env));
            }
        };
    }
    return plugin;
};



// /**
//  * @method _upload
//  * @param {WebpackStatsAsset[]} assets
//  * @param {WebpackEnvironment} env
//  */
// const dupHashFile= (assets, env) =>
// {
//     const items = readdirSync(resolve("..", "dist")),
//           teModule = assets.find(a => a.startsWith("taskexplorer") && a.endsWith(".js"));
//     if (teModule) {
//         copyFileSync(teModule.name, "taskexplorer.js");
//     }
// };



/**
 * @method licenseFiles
 * @param {WebpackEnvironment} env
 * @returns {Promise<void>}
 */
const licenseFiles = async (env) =>
{
    const distPath = env.stripLogging ? env.paths.dist : env.paths.temp,
          items = readdirSync(distPath);
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

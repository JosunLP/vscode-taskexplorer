/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.finalize
 */

const { join, resolve } = require("path");
const { existsSync, copyFileSync, readdirSync } = require("fs");
const { rename, unlink, readdir } = require("fs/promises");
const { asArray } = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method finalize
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
            apply: (compiler) =>
            {
                compiler.hooks.shutdown.tapPromise("FinalizeShutdownPlugin", async () =>
                {
                    dupHashFile(env, wpConfig);
                    await licenseFiles(env);
                });
                // if (compilation.hooks.statsPrinter)
                // {
                //     compilation.hooks.statsPrinter.tap("FinalizeShutdownPlugin", stats => {
                //         stats.hooks.print.for("asset.info.copied").tap("FinalizeShutdownPluginPrint", (copied, {
                //         green,
                //         formatFlag
                //         }) => copied ?
                //         /** @type {Function} */
                //         green(
                //         /** @type {Function} */
                //         formatFlag("copied")) : "");
                //     });
                // }
            }
        };
    }
    return plugin;
};



/**
 * @method _upload
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const dupHashFile= (env, wpConfig) =>
{
    asArray(env.app.mainChunk).forEach((chunk) =>
    {
        const items = readdirSync(env.paths.dist),
              digestLen = /** @type {Number} */(wpConfig.output.hashDigestLength),
              testRgx = new RegExp(`${chunk}\\.[0-9a-f]{${digestLen}}\\.js`),
              teModule = items.find(a => testRgx.test(a));
        if (teModule) {
            copyFileSync(join(env.paths.dist, teModule), join(env.paths.dist, `${chunk}.js`));
        }
    });
};



/**
 * @method licenseFiles
 * @param {WebpackEnvironment} env
 * @returns {Promise<void>}
 */
const licenseFiles = async (env) =>
{
    const distPath = env.buildMode === "release" ? env.paths.dist : env.paths.temp,
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

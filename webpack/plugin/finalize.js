/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.asset
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
                compiler.hooks.shutdown.tapPromise("FinalizeShutdownPlugin", async () => { dupHashFile(env); await licenseFiles(env); });
            }
        };
    }
    return plugin;
};



/**
 * @method _upload
 * @param {WebpackEnvironment} env
 */
const dupHashFile= (env) =>
{
    asArray(env.app.mainChunk).forEach((chunk) =>
    {
        const items = readdirSync(resolve("..", "dist")),
            teModule = items.find(a => a.startsWith(chunk) && a.endsWith(".js"));
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
    const distPath = env.stripLogging ? env.paths.dist : env.paths.temp,
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

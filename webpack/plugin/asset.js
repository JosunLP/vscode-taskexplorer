/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.asset
 */

const { join } = require("path");
const { existsSync, readFileSync } = require("fs");
const { writeInfo, figures } = require("../console");
const { writeFile, rename, unlink } = require("fs/promises");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackAssetEmittedInfo} WebpackAssetEmittedInfo */


/**
 * @method beforeemit
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const asset = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.assetEmitted.tapPromise("AssetBeforeEmitPlugin", async (file, /** @type {WebpackAssetEmittedInfo} */info) =>
                {
                    if (env.environment === "test") {
                        await istanbulTags(file, info.content, env);
                    }
                    else if (env.environment === "prod") {
                        await licenseFiles(file);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @method istanbulFileTags
 * @param {String} filePath  file full path
 * @param {Buffer} content
 * @param {WebpackEnvironment} env
 */
const istanbulTags = async (filePath, content, env) =>
{
    const outFile = join(env.paths.dist, filePath);
    if (existsSync(outFile))
    {
        try {
            const regex = /\n[ \t]*module\.exports \= require\(/mg,
                  newContent = content.toString().replace(regex, (v) => "/* istanbul ignore next */" + v);
            await writeFile(filePath, newContent);
        } catch {}
        if (content.includes("/* istanbul ignore file */")) {
            writeInfo("The '/* istanbul ignore file */ ' tag was found and will break coverage", figures.error);
        }
    }
};


/**
 * @method licenseFiles
 * @param {String} filePath file full path
 */
const licenseFiles = async (filePath) =>
{
    try {
        if (!filePath.includes(".debug")) {
            await rename(filePath, `${filePath.replace("js.LICENSE.txt", "LICENSE")}`);
        }
        else {
            await unlink(filePath);
        }
    } catch {}
};


module.exports = asset;

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
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
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
        const _env = { ...env };
        plugin =
        {   /** @param {WebpackCompiler} compiler Compiler */
            apply: (compiler) =>
            {
                compiler.hooks.assetEmitted.tapAsync("AssetBeforeEmitPlugin", async (file, /** @type {WebpackAssetEmittedInfo} */info) =>
                {
console.log("asset assetEmitted filename1: " + file);
console.log("asset assetEmitted filename2: " + join(info.outputPath, file));
console.log("asset assetEmitted filename3: " + info.targetPath);
                    await new Promise(res => setTimeout(res, 2000));
console.log("waited asset assetEmitted filename4: " + file);
                    if (_env.environment === "test") {
                        // await istanbulTags(file, info.content, _env);
                    }
                    else if (env.environment === "prod") {
                        // await renameLicense(file, _env);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @method istanbulFileTags
 * @param {String} file filename e.g. `taskexplorer.[hash].js`
 * @param {Buffer} content
 * @param {WebpackEnvironment} env
 */
const istanbulTags = async (file, content, env) =>
{
    const outFile = join(env.paths.dist, file);
    if (existsSync(outFile))
    {
        try {
            const regex = /\n[ \t]*module\.exports \= require\(/mg,
                  content = readFileSync(outFile, "utf8"),
                  newContent = content.toString().replace(regex, (v) => "/* istanbul ignore next */" + v);
            // writeFileSync(outFile, newContent);
            await writeFile(file, newContent);
        } catch {}
        if (content.includes("/* istanbul ignore file */")) {
            writeInfo("The '/* istanbul ignore file */ ' tag was found and will break coverage", figures.error);
        }
    }
};


/**
 * @method licenseFiles
 * @param {String} file filename e.g. `taskexplorer.[hash].js`
 * @param {WebpackEnvironment} env
 */
const renameLicense = async (file, env) =>
{
    try { await rename(join(env.paths.dist, `${file}.LICENSE.txt`), join(env.paths.dist, "vendor.LICENSE")); } catch {}
};


module.exports = asset;

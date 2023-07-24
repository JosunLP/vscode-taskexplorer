/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { apply } = require("../utils");
const { writeFileSync, readFileSync, existsSync } = require("fs");
const { writeInfo, withColor, figures, colors, write } = require("../console");

/**
 * @module webpack.plugin.hash
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackHashState} WebpackHashState */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackAssetEmittedInfo} WebpackAssetEmittedInfo */


/**
 * @method hash
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 * @returns {WebpackPluginInstance | undefined}
 */
const hash = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        plugin =
        {
			apply: (compiler) =>
            {
                compiler.hooks.done.tap("HashDonePlugin", (statsData) =>
                {
                    if (statsData.hasErrors()) { return; }
                    const stats = statsData.toJson(),
                          assets = stats.assets?.filter(a => a.type === "asset"),
                          assetChunks = stats.assetsByChunkName;
                    if (assets && assetChunks)
                    {
                        Object.keys(assetChunks).forEach((k) =>
                        {
                            const asset = assets.find(a => a.name === assetChunks[k][0]);
                            if (asset && asset.chunkNames)
                            {
                                setAssetState(asset, env, wpConfig);
                            }
                        });
                        saveAssetState(env);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @method readAssetStates
 * @param {WebpackHashState} hashInfo
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 */
const logAssetInfo = (hashInfo, wpConfig) =>
{
    const // hashLength = /** @type {Number} */(wpConfig.output?.hashDigestLength),
          labelLength = 25; //  + hashLength;
    // write(" ");
   //  write(withColor("asset state info for " + wpConfig.name, colors.white), figures.color.start);
    writeInfo("   current:");
    Object.keys(hashInfo.current).forEach(
        (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + withColor(hashInfo.current[k], colors.blue))
    );
    writeInfo("   next:");
    Object.keys(hashInfo.next).forEach(
        (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + withColor(hashInfo.next[k], colors.blue))
    );
};


/**
 * @method prehash
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 * @returns {WebpackPluginInstance | undefined}
 */
const prehash = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
	let plugin;
	if (env.build === "extension")
	{
        plugin =
		{
			apply: (compiler) =>
			{
                compiler.hooks.initialize.tap("HashInitializePlugin", () => readAssetStates(env, wpConfig));
			}
		};
	}
	return plugin;
};


/**
 * @method saveAssetState
 * @param {WebpackEnvironment} env
 */
const saveAssetState = (env) => writeFileSync(env.paths.files.hash, JSON.stringify(env.state.hash, null, 4));


/**
 * @method setAssetState
 * @param {WebpackStatsAsset} asset
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 */
const setAssetState = (asset, env, wpConfig) =>
{
    write(" ");
    write(withColor(`set asset state for ${withColor(asset.name, colors.blue)}`, colors.white), figures.color.start);
    if (asset.chunkNames && asset.info.contenthash)
    {
        const chunkName = /** @type {String}*/(asset.chunkNames[0]);
        env.state.hash.next[chunkName] = asset.info.contenthash.toString();
        logAssetInfo(env.state.hash, wpConfig);
    }
};


/**
 * @method readAssetStatesv
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 */
const readAssetStates = (env, wpConfig) =>
{
    write(withColor(`read asset states from ${env.paths.files.hash}`, colors.white), figures.color.start);
    if (existsSync(env.paths.files.hash))
    {
        const hashJson = readFileSync(env.paths.files.hash, "utf8");
        apply(env.state.hash, JSON.parse(hashJson));
        env.state.hash.current = {};
        apply(env.state.hash.current, { ...env.state.hash.next });
        env.state.hash.next = {};
        logAssetInfo(env.state.hash, wpConfig);
    }
    else {
        writeInfo("   asset state cache file does not exist");
    }
};


module.exports = { hash, prehash };

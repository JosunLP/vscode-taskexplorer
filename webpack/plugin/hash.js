/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { writeFileSync, readFileSync, existsSync } = require("fs");
const { join } = require("path");
const { writeInfo, withColor, figures, colors } = require("../console");

/**
 * @module webpack.plugin.hash
 */

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackEnvHashState} WebpackEnvHashState */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackAssetEmittedInfo} WebpackAssetEmittedInfo */


/**
 * @method hash
 * @param {WebpackEnvironment} env
 * @returns {WebpackPluginInstance | undefined}
 */
const hash = (env) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        const _env = { ...env };
        plugin =
        {
			apply: /** @param {WebpackCompiler} compiler */(compiler) =>
            {
                compiler.hooks.done.tap("HashCheckPlugin", (statsData) =>
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
                            if (asset) {
                                readAssetStates(asset.name, false, _env);
                                setAssetState(asset, _env);
                            }
                        });
                        saveAssetState(_env);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @method readAssetStates
 * @param {String} assetFile
 * @param {WebpackEnvHashState} hashInfo
 */
const logAssetInfo = (assetFile, hashInfo) =>
{
    console.log("");
    writeInfo(`read asset state info for ${withColor(assetFile, colors.blue)}:`);
    writeInfo("   current:");
    Object.keys(hashInfo.current).forEach(k => writeInfo(`      ${k.padEnd(13)} : ` + hashInfo.current[k]));
    writeInfo("   new:");
    Object.keys(hashInfo.next).forEach(k => writeInfo(`      ${k.padEnd(13)} : ` + hashInfo.next[k]));
};


/**
 * @method prehash
 * @param {WebpackEnvironment} env
 * @returns {WebpackPluginInstance | undefined}
 */
const prehash = (env) =>
{
	let plugin;
	if (env.build === "extension")
	{
		const _env = { ...env };
		plugin =
		{
			apply: /** @param {WebpackCompiler} compiler*/(compiler) =>
			{
                compiler.hooks.assetEmitted.tap("PreHashCheckPlugin", (file, /** @type {WebpackAssetEmittedInfo} */info) =>
                {
console.log("prehash assetEmitted filename: " + file);
                    readAssetStates(file, true, _env);
                });
			}
		};
	}
	return plugin;
};


/**
 * @method saveAssetState
 * @param {WebpackEnvironment} env
 */
const saveAssetState = (env) => writeFileSync(env.paths.files.hash, JSON.stringify(env.state, null, 4));


/**
 * @method setAssetState
 * @param {WebpackStatsAsset} asset
 * @param {WebpackEnvironment} env
 */
const setAssetState = (asset, env) =>
{
    if (asset.chunkNames && asset.info.contenthash)
    {
        const hashInfo = /** @type {WebpackEnvHashState} */(env.state.hash[env.environment]),
              chunkName = /** @type {String}*/(asset.chunkNames[0]);
        hashInfo.next[asset.name] = asset.info.contenthash.toString();
        writeInfo(`set asset state info for ${asset.name}`);
        writeInfo("   chunk         : " + chunkName);
        writeInfo("   size          : " + asset.info.size);
        writeInfo("   content hash  : " + hashInfo.next[asset.name]);
    }
    else {
        writeInfo("invalid asset info", figures.color.warning);
    }
};


/**
 * @method readAssetStates
 * @param {String} assetFile
 * @param {Boolean} rotate
 * @param {WebpackEnvironment} env
 */
const readAssetStates = (assetFile, rotate, env) =>
{
    if (existsSync(env.paths.files.hash))
    {
        const hashInfo = /** @type {WebpackEnvHashState} */(env.state.hash[env.environment]);
        try {
            Object.assign(env.state, JSON.parse(readFileSync(env.paths.files.hash, "utf8")));
            if (rotate)
            {
                Object.keys(hashInfo.current).forEach(k => delete hashInfo.current[k]);
                Object.assign(hashInfo.current, { ...hashInfo.next });
                Object.keys(hashInfo.next).forEach(k => delete hashInfo.next[k]);
                saveAssetState(env);
            }
            logAssetInfo(assetFile, hashInfo);
        }
        catch {}
    }
};


module.exports = { hash, prehash };

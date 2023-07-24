/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { writeFileSync, readFileSync, existsSync } = require("fs");
const { join } = require("path");
const { writeInfo, figures } = require("../console");

/**
 * @module webpack.plugin.hash
 */

/** @typedef {import("../types/webpack").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("webpack").AssetEmittedInfo} WebpackAssetEmittedInfo */
/** @typedef {import("webpack").Compiler} WebpackCompiler */


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
                        readAssetStates(_env, false);
                        Object.keys(assetChunks).forEach(
                            (k) => setAssetState(assets.find(a => a.name === assetChunks[k][0]), _env)
                        );
                        saveAssetState(_env);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
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
			apply: /** @param {WebpackCompiler} compiler */(compiler) =>
			{
                compiler.hooks.assetEmitted.tap("PreHashCheckPlugin", (file, /** @type {WebpackAssetEmittedInfo} */info) =>
                {
                    readAssetStates(_env, true);
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
const saveAssetState = (env) => writeFileSync(env.paths.hashFile, JSON.stringify(env.state, null, 4));


/**
 * @method setAssetState
 * @param {WebpackStatsAsset | undefined} asset
 * @param {WebpackEnvironment} env
 */
const setAssetState = (asset, env) =>
{
    if (asset && asset.chunkNames && asset.info.contenthash)
    {
        const chunkName = /** @type {String} */(asset.chunkNames[0]);
        env.state.hashNew[asset.name] = asset.info.contenthash.toString();
        writeInfo(`set asset state info for ${asset.name}`);
        writeInfo("   chunk         : " + chunkName);
        writeInfo("   size          : " + asset.info.size);
        writeInfo("   content hash  : " + env.state.hashNew[asset.name]);
    }
    else {
        writeInfo("invalid asset info", figures.color.warning);
    }
};


/**
 * @method readAssetStates
 * @param {WebpackEnvironment} env
 * @param {Boolean} rotate
 */
const readAssetStates = (env, rotate) =>
{
    if (existsSync(env.paths.hashFile))
    {
        try {
            Object.assign(env.state, JSON.parse(readFileSync(env.paths.hashFile, "utf8")));
            console.log("");
            writeInfo("read asset state info:");
            writeInfo("   current:");
            Object.keys(env.state.hashCurrent).forEach(k => writeInfo(`      ${k.padEnd(13)} : ` + env.state.hashCurrent[k]));
            writeInfo("   new:");
            Object.keys(env.state.hashNew).forEach(k => writeInfo(`      ${k.padEnd(13)} : ` + env.state.hashNew[k]));
            writeInfo("read asset state info complete");
            if (rotate)
            {
                Object.keys(env.state.hashCurrent).forEach(k => delete env.state.hashCurrent[k]);
                Object.assign(env.state.hashCurrent, { ...env.state.hashNew });
                Object.keys(env.state.hashNew).forEach(k => delete env.state.hashNew[k]);
                saveAssetState(env);
            }
        }
        catch {}
    }
};


module.exports = { hash, prehash };

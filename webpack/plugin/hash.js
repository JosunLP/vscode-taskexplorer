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
			apply: /** @param {import("webpack").Compiler} compiler */(compiler) =>
            {
                compiler.hooks.done.tap("HashCheckPlugin", (statsData) =>
                {
                    if (statsData.hasErrors()) { return; }
                    const stats = statsData.toJson(),
                          assets = stats.assets?.filter(a => a.type === "asset"),
                          assetChunks = stats.assetsByChunkName;
                    if (assets && assetChunks)
                    {
                        readAssetState(_env);
                        Object.keys(assetChunks).forEach(k => setAssetState(assets.find(a => a.name === assetChunks[k][0]), _env));
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
			apply: /** @param {import("webpack").Compiler} compiler */(compiler) =>
			{
                compiler.hooks.done.tap("PreHashCheckPlugin", () => readAssetState(_env));
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
    if (asset && asset.chunkNames)
    {
        writeInfo("set asset state info   : " + asset.name);
        const chunkName = /** @type {String} */(asset.chunkNames[0]);
        env.state.hashNew[chunkName] = asset.info.contenthash?.toString();
        writeInfo("   size   : " + asset.info.size);
        writeInfo("   content hash   : " + env.state.hashNew);
    }
    else {
        writeInfo("invalid asset info", figures.color.warning);
    }
};


/**
 * @method readAssetState
 * @param {WebpackEnvironment} env
 */
const readAssetState = (env) =>
{
    if (existsSync(env.paths.hashFile)) { try { Object.assign(env.state, JSON.parse(readFileSync(env.paths.hashFile, "utf8"))); } catch {}}
};


module.exports = { hash, prehash };

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { writeInfo, figures } = require("../console");

/**
 * @module webpack.plugin.done
 */

/** @typedef {import("../types/webpack").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */

/**
 * @method done
 * @param {WebpackEnvironment} env
 * @returns {WebpackPluginInstance | undefined}
 */
const done = (env) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        const _env = { ...env };
        plugin =
        {   /** @param {import("webpack").Compiler} compiler Compiler */
            apply: (compiler) =>
            {
                compiler.hooks.done.tap("DonePlugin", (statsData) =>
                {
                    if (statsData.hasErrors()) { return; }
                    const stats = statsData.toJson(),
                          assets = stats.assets?.filter(a => a.type === "asset"),
                          assetChunks = stats.assetsByChunkName;
                    if (assets && assetChunks)
                    {
                        Object.keys(assetChunks).forEach(k => setAssetState(assets.find(a => a.name === assetChunks[k][0]), _env));
                    }
                });
            }
        };
    }
    return plugin;
};


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
        env.state.hashNew[asset.chunkNames[0]] = asset.info.contenthash?.toString();
        writeInfo("   size   : " + asset.info.size);
        writeInfo("   content hash   : " + env.state.hashNew);
    }
    else {
        writeInfo("invalid asset info", figures.color.warning);
    }
};


module.exports = done;

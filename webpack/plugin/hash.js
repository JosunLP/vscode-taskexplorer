/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { apply, isObjectEmpty } = require("../utils/utils");
const { writeFileSync, readFileSync, existsSync } = require("fs");
const { writeInfo, withColor, colors, write } = require("../utils/console");

/**
 * @module webpack.plugin.hash
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildHashState} WpBuildHashState */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackAssetEmittedInfo} WebpackAssetEmittedInfo */


/**
 * @function hash
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 * @returns {WebpackPluginInstance | undefined}
 */
const hash = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.app.plugins.hash !== false && env.build === "extension")
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
 * @function readAssetStates
 * @param {WpBuildHashState} hashInfo
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 * @param {boolean} [rotated] `true` indicates that values were read and rotated
 * i.e. `next` values were moved to `current`, and `next` is now blank
 */
const logAssetInfo = (hashInfo, wpConfig, rotated) =>
{
    const // hashLength = /** @type {Number} */(wpConfig.output?.hashDigestLength),
          labelLength = 18; //  + hashLength;
    // write(" ");
   //  write(withColor("asset state info for " + wpConfig.name, colors.white), figures.color.start);
    writeInfo("   current:");
    Object.keys(hashInfo.current).forEach(
        (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + withColor(hashInfo.current[k], colors.blue))
    );
    writeInfo("   next:");
    if (!isObjectEmpty(hashInfo.next))
    {
        Object.keys(hashInfo.next).forEach(
            (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + withColor(hashInfo.next[k], colors.blue))
        );
    }
    else if (!isObjectEmpty(hashInfo.current) && rotated === true) {
        writeInfo("      values cleared and moved to 'current'");
    }
};


/**
 * @function prehash
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 * @returns {WebpackPluginInstance | undefined}
 */
const prehash = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
	let plugin;
	if (env.app.plugins.hash && env.build === "extension")
	{
        plugin =
		{
			apply: (compiler) =>
			{
                // const cache = compilation.getCache("CompileThisCompilationPlugin"),
                //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                compiler.hooks.initialize.tap("HashInitializePlugin", () => readAssetStates(env, wpConfig));
			}
		};
	}
	return plugin;
};


/**
 * @function readAssetStatesv
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 */
const readAssetStates = (env, wpConfig) =>
{
    writeInfo(`read asset states from ${env.paths.files.hash}`);
    if (existsSync(env.paths.files.hash))
    {
        const hashJson = readFileSync(env.paths.files.hash, "utf8");
        apply(env.state.hash, JSON.parse(hashJson));
        env.state.hash.current = {};
        apply(env.state.hash.current, { ...env.state.hash.next });
        env.state.hash.next = {};
        logAssetInfo(env.state.hash, wpConfig, true);
    }
    else {
        writeInfo("   asset state cache file does not exist");
    }
};


/**
 * @function saveAssetState
 * @param {WpBuildEnvironment} env
 */
const saveAssetState = (env) => writeFileSync(env.paths.files.hash, JSON.stringify(env.state.hash, null, 4));


/**
 * @function setAssetState
 * @param {WebpackStatsAsset} asset
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 */
const setAssetState = (asset, env, wpConfig) =>
{
    write(withColor(`set asset state for ${withColor(asset.name, colors.italic)}`, colors.grey));
    if (asset.chunkNames && asset.info.contenthash)
    {
        const chunkName = /** @type {string}*/(asset.chunkNames[0]);
        env.state.hash.next[chunkName] = asset.info.contenthash.toString();
        //
        // Remove any old leftover builds in the dist directory
        //
        // if (env.state.hash.next[chunkName] !== env.state.hash.current[chunkName])
        // {
        //     readdirSync(env.paths.dist).filter(p => (/[a-f0-9]{16,}/).test(p)).forEach((p) =>
        //     {
        //         if (!p.includes(env.state.hash.next[chunkName])) {
        //             unlinkSync(p);
        //         }
        //     });
        // }
        logAssetInfo(env.state.hash, wpConfig);
    }
};


module.exports = { hash, prehash };

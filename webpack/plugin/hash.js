/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const WpBuildBasePlugin = require("./base");
const { writeFileSync, readFileSync, existsSync } = require("fs");
const { apply, isObjectEmpty, writeInfo, withColor, colors, write, merge } = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildHashState} WpBuildHashState */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackAssetEmittedInfo} WebpackAssetEmittedInfo */


/**
 * @class WpBuildHashPlugin
 */
class WpBuildHashPlugin extends WpBuildBasePlugin
{

    /**
     * @class
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.readAssetStates();
    }


    /**
     * @function Called by webpack runtime to apply this plugin
     *
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        compiler.hooks.done.tap(this.constructor.name, (statsData) =>
        {
            if (statsData.hasErrors()) { return; }
            const stats = statsData.toJson(),
                  assets = stats.assets?.filter(a => a.type === "asset"),
                  assetChunks = stats.assetsByChunkName;
            if (assets && assetChunks)
            {
                this.setAssetState(assets);
                this.saveAssetState();
            }
        });
    }


    /**
     * @function readAssetStates
     * @param {boolean} [rotated] `true` indicates that values were read and rotated
     * i.e. `next` values were moved to `current`, and `next` is now blank
     */
    logAssetInfo(rotated)
    {
        const // hashLength = /** @type {Number} */(wpConfig.output?.hashDigestLength),
              hashInfo = this.options.env.state.hash,
              labelLength = 18; //  + hashLength;
        write(withColor(`final asset state for build environment ${withColor(this.options.env.environment, colors.italic)}`, colors.grey));
        writeInfo("   previous:");
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.previous).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + withColor(hashInfo.current[k], colors.blue))
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            writeInfo("      there are no previous hashes stoerd");
        }
        writeInfo("   current:");
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.current).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + withColor(hashInfo.current[k], colors.blue))
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            writeInfo("      values cleared and moved to 'previous'");
        }
        writeInfo("   next:");
        if (!isObjectEmpty(hashInfo.next))
        {
            Object.keys(hashInfo.next).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + hashInfo.next[k]) // withColor(hashInfo.next[k], colors.blue))
            );
        }
        else if (!isObjectEmpty(hashInfo.current) && rotated === true) {
            writeInfo("      values cleared and moved to 'current'");
        }
    };


    readAssetStates()
    {
        const env = this.options.env;
        writeInfo(`read asset states from ${withColor(env.paths.files.hash, colors.italic)}`);
        if (existsSync(env.paths.files.hash))
        {
            const hashJson = readFileSync(env.paths.files.hash, "utf8");
            apply(env.state.hash, JSON.parse(hashJson));
            apply(env.state.hash.previous, { ...env.state.hash.current });
            apply(env.state.hash.current, { ...env.state.hash.next });
            env.state.hash.next = {};
            this.logAssetInfo(true);
        }
        else {
            writeInfo("   asset state cache file does not exist");
        }
    };


    /**
     * @function saveAssetState
     */
    saveAssetState() { writeFileSync(this.options.env.paths.files.hash, JSON.stringify(this.options.env.state.hash, null, 4)); }


    /**
     * @function setAssetState
     * @param {WebpackStatsAsset[]} assets
     */
    setAssetState(assets)
    {
        Object.keys(assets).forEach((k, i, a) =>
        {
            const asset = assets.find(a => a.name === assets[k][0]);
            if (asset && asset.chunkNames)
            {
                // write(withColor(`set asset state for ${withColor(asset.name, colors.italic)}`, colors.grey));
                if (asset.chunkNames && asset.info.contenthash)
                {
                    const chunkName = /** @type {string}*/(asset.chunkNames[0]);
                    this.options.env.state.hash.next[chunkName] = asset.info.contenthash.toString();
                    //
                    // Remove any old leftover builds in the dist directory
                    //
                    // if (env.state.hash.next[chunkName] !== env.state.hash.current[chunkName])
                    // {
                    //     const hashDigestLength = compiler.options.output.hashDigestLength || wpConfig.output.hashDigestLength || 20,
                    //     readdirSync(env.paths.dist).filter(p => (new RegExp(`\\.[a-z0-9]{${hashDigestLength}}`).test(p)).forEach((p) =>
                    //     {
                    //         if (!p.includes(env.state.hash.next[chunkName])) {
                    //             unlinkSync(p);
                    //         }
                    //     });
                    // }
                    if (i === a.length - 1) {
                        this.logAssetInfo();
                    }
                }
            }
        });
    };

}


/**
 * @module hash
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 * @returns {WebpackPluginInstance | undefined}
 */
const hash = (env, wpConfig) =>
{
    if (env.app.plugins.hash !== false && env.build === "extension")
    {
        return new WpBuildHashPlugin({ env, wpConfig });
    }
};


module.exports = hash;

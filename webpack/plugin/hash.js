/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const WpBuildBasePlugin = require("./base");
const { writeFileSync, readFileSync, existsSync } = require("fs");
const { apply, colors, isObjectEmpty, writeInfo, withColor, write, tagColor } = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


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
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            setAssetState: {
                hook: "afterEmit",
				statsProperty: "copied",
                callback: this.setAssetState.bind(this)
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
                (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + tagColor(hashInfo.current[k]))
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            writeInfo("      there are no previous hashes stoerd");
        }
        writeInfo("   current:");
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.current).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + tagColor(hashInfo.current[k]))
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            writeInfo("      values cleared and moved to 'previous'");
        }
        writeInfo("   next:");
        if (!isObjectEmpty(hashInfo.next))
        {
            Object.keys(hashInfo.next).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength)} : ` + tagColor(hashInfo.next[k]))
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
     * @function
     * @private
     * @param {WebpackCompilation} compilation
     */
    setAssetState(compilation)
    {
        this.compilation = compilation;
        Array.from(compilation.chunks).forEach((chunk, idx, arr) =>
        {
            Array.from(chunk.files).filter(f => this.matchObject(f)).forEach((file) =>
            {
                const asset = compilation.getAsset(file);
                if (chunk.name &&  asset?.info?.contenthash)
                {
                    this.options.env.state.hash.next[chunk.name] = asset.info.contenthash.toString();
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
                }
            });
            if (idx === arr.length - 1) { this.logAssetInfo(); }
        });
    };

}


/**
 * @module hash
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack `exports` config object
 * @returns {WpBuildHashPlugin | undefined}
 */
const hash = (env, wpConfig) =>
{
    if (env.app.plugins.hash !== false && env.build === "extension")
    {
        return new WpBuildHashPlugin({ env, wpConfig });
    }
};


module.exports = hash;

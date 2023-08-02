/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.runtimevars
 */

const WpBuildBasePlugin = require("./base");
const { readFileSync, existsSync, writeFileSync } = require("fs");
const {
    isString, apply, withColor, writeInfo, colors, isObjectEmpty, tagColor, asArray
} = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackSource} WebpackSource */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackAssetInfo} WebpackAssetInfo */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */


/**
 * @class WpBuildRuntimeVarsPlugin
 */
class WpBuildRuntimeVarsPlugin extends WpBuildBasePlugin
{
    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            readAsetState: {
                hook: "afterPlugins",
                callback: this.readAssetState.bind(this)
            },
            preprocess: {
                hook: "compilation",
                stage: "PRE_PROCESS",
                callback: this.preprocess.bind(this)
            },
            runtimeVars: {
                hook: "compilation",
                stage: "ADDITIONS",
                statsProperty: "runtimeVars",
                callback: this.runtimeVars.bind(this)
            },
            saveAssetState: {
                hook: "afterEmit",
                callback: this.saveAssetState.bind(this)
            }
        });
    }


    /**
     * @function
     * @private
     * @param {WebpackAssetInfo} info
     */
    info(info) { return apply(info || {}, { runtimeVars: true }); }


    /**
     * @function
     * @private
     * @param {boolean} [rotated] `true` indicates that values were read and rotated
     * i.e. `next` values were moved to `current`, and `next` is now blank
     */
    logAssetInfo(rotated)
    {
        const hashInfo = this.env.state.hash,
              labelLength = this.env.app.logPad.value;
        writeInfo(`${rotated ? "read" : "saved"} asset state for build environment ${withColor(this.env.environment, colors.italic)}`);
        writeInfo("   previous:");
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.previous).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength - 7)} ` + tagColor(hashInfo.current[k]))
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            writeInfo("      there are no previous hashes stoerd");
        }
        writeInfo("   current:");
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.current).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength - 7)} ` + tagColor(hashInfo.current[k]))
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            writeInfo("      values cleared and moved to 'previous'");
        }
        writeInfo("   next:");
        if (!isObjectEmpty(hashInfo.next))
        {
            Object.keys(hashInfo.next).forEach(
                (k) => writeInfo(`      ${k.padEnd(labelLength - 7)} ` + tagColor(hashInfo.next[k]))
            );
        }
        else if (!isObjectEmpty(hashInfo.current) && rotated === true) {
            writeInfo("      values cleared and moved to 'current'");
        }
    };


    /**
     * @function Collects content hashes from compiled assets
     * @private
     * @param {WebpackCompilationAssets} assets
     */
    preprocess(assets)
    {
        const env = this.env,
              hashCurrent = env.state.hash.current;
        writeInfo(`check asset states from ${withColor(env.paths.files.hash, colors.italic)}`, true);
        asArray(this.compilation.chunks).filter(c => isString(c.name)).forEach((chunk) =>
        {
            const chunkName = /** @type {string} */(chunk.name);
            asArray(chunk.files).filter(f => this.matchObject(f)).forEach((file) =>
            {
                if (!hashCurrent[chunkName])
                {
                    hashCurrent[chunkName] = chunk.contentHash.javascript;
                    writeInfo("updated contenthash for " + withColor(file, colors.italic));
                    writeInfo(`   ${"previous".padEnd(env.app.logPad.value)}empty}`);
                    writeInfo(`   ${"new".padEnd(env.app.logPad.value)}${chunk.contentHash.javascript}`);
                }
                if (hashCurrent[chunkName] !==  chunk.contentHash.javascript)
                {
                    hashCurrent[chunkName] = chunk.contentHash.javascript;
                    writeInfo("updated stale contenthash for " + withColor(file, colors.italic));
                    writeInfo(`   ${"previous".padEnd(env.app.logPad.value)}${hashCurrent[file]}`);
                    writeInfo(`   ${"new".padEnd(env.app.logPad.value)}${chunk.contentHash.javascript}`);
                }
            });
        });
    };


    /**
     * @function Reads stored / cached content hashes from file
     * @private
     */
    readAssetState()
    {
        const env = this.env;
        if (existsSync(env.paths.files.hash))
        {
            const hashJson = readFileSync(env.paths.files.hash, "utf8");
            apply(env.state.hash, JSON.parse(hashJson));
            apply(env.state.hash.previous, { ...env.state.hash.current });
            apply(env.state.hash.current, { ...env.state.hash.next });
            env.state.hash.next = {};
            this.logAssetInfo(true);
        }
    };


    /**
     * @function
     * @private
     * @param {WebpackCompilationAssets} _assets
     */
    runtimeVars(_assets)
    {
        const hashMap = this.env.state.hash.next,
              updates = /** @type {string[]} */([]);
        asArray(this.compilation.chunks).filter(c => isString(c.name)).forEach((chunk) =>
        {
            const chunkName = /** @type {string} */(chunk.name);
            asArray(chunk.files).filter(f => this.matchObject(f)).forEach((file) =>
            {
                hashMap[chunkName] = chunk.contentHash.javascript;
                if (chunk.canBeInitial()) {
                    updates.push(file);
                }
            });
        });
        updates.forEach((f) => this.compilation.updateAsset(f, (s) => this.source(f, s), this.info.bind(this)));
    };


    /**
     * @function Writes / caches asset content hashes to file
     * @private
     */
    saveAssetState()
    {
        this.logAssetInfo();
        writeFileSync(this.env.paths.files.hash, JSON.stringify(this.env.state.hash, null, 4));
    }


    /**
     * @function Performs all source code modifications
     * @private
     * @param {string} file
     * @param {WebpackSource} sourceInfo
     * @returns {WebpackSource}
     */
    source(file, sourceInfo)
    {
        let sourceCode = sourceInfo.source().toString();
        /* MOD 1 */sourceCode = this.sourceUpdateHashVars(sourceCode);
        return this.sourceObj(file, sourceCode, sourceInfo);
    }


    /**
     * @function
     * @private
     * @param {string} file
     * @param {string | Buffer} content
     * @param {WebpackSource} sourceInfo
     * @returns {WebpackSource}
     */
    sourceObj(file, content, sourceInfo)
    {
        const { source, map } = sourceInfo.sourceAndMap();
        return map && (this.compiler.options.devtool || this.env.app.plugins.sourcemaps) ?
               new this.compiler.webpack.sources.SourceMapSource(content, file, map, source) :
               new this.compiler.webpack.sources.RawSource(content);
    }


    /**
     * @function Performs source code modifications for \_\_WPBUILD\_\_[contentHash]
     * @private
     * @param {string} sourceCode
     * @returns {string}
     */
    sourceUpdateHashVars(sourceCode)
    {
        Object.entries(this.env.state.hash.next).forEach(([ chunkName, hash ]) =>
        {
            const regex = new RegExp(`(?:interface_[0-9]+\\.)?__WPBUILD__\\.contentHash(?:\\.|\\[")${chunkName}(?:"\\])? *(,|\r|\n)`, "gm");
            sourceCode = sourceCode.replace(regex, (_v, g) =>`"${hash}"${g}`);
        });
        return sourceCode;
    }

}


/**
 * @function
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WpBuildRuntimeVarsPlugin | undefined}
 */
const runtimevars = (env, wpConfig) =>
    (env.app.plugins.runtimevars !== false && env.isExtension ? new WpBuildRuntimeVarsPlugin({ env, wpConfig }) : undefined);


module.exports = runtimevars;

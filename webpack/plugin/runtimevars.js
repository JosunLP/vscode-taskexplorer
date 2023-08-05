/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.runtimevars
 */

const WpBuildBasePlugin = require("./base");
const { readFileSync, existsSync, writeFileSync } = require("fs");
const { isString, apply, isObjectEmpty, asArray } = require("../utils");

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
     * @function Called by webpack runtime to initialize this plugin
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
        const logger = this.env.logger,
              hashInfo = this.env.state.hash,
              labelLength = this.env.app.log.pad.value;
        logger.write(`${rotated ? "read" : "saved"} asset state for build environment ${logger.withColor(this.env.environment, logger.colors.italic)}`, 1);
        logger.write("   previous:", 2);
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.previous).forEach(
                (k) => logger.write(`      ${k.padEnd(labelLength - 7)} ` + logger.tagColor(hashInfo.current[k]), 2, "", 0, logger.colors.grey)
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            logger.write("      there are no previous hashes stored", 2);
        }
        logger.write("   current:", 2);
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.current).forEach(
                (k) => logger.write(`      ${k.padEnd(labelLength - 7)} ` + logger.tagColor(hashInfo.current[k]), 2, "", 0, logger.colors.grey)
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            logger.write("      values cleared and moved to 'previous'", 2);
        }
        logger.write("   next:", 2);
        if (!isObjectEmpty(hashInfo.next))
        {
            Object.keys(hashInfo.next).forEach(
                (k) => logger.write(`      ${k.padEnd(labelLength - 7)} ` + logger.tagColor(hashInfo.next[k]), 2, "", 0, logger.colors.grey)
            );
        }
        else if (!isObjectEmpty(hashInfo.current) && rotated === true) {
            logger.write("      values cleared and moved to 'current'", 2);
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
              logger = env.logger,
              hashCurrent = env.state.hash.current;
        logger.write(`validate hashes for assets in italic(${env.paths.files.hashStoreJson})`, 2);
        asArray(this.compilation.chunks).filter(c => isString(c.name)).forEach((chunk) =>
        {
            const chunkName = /** @type {string} */(chunk.name);
            asArray(chunk.files).filter(f => this.matchObject(f)).forEach((file) =>
            {
                if (!hashCurrent[chunkName])
                {
                    hashCurrent[chunkName] = chunk.contentHash.javascript;
                    logger.write(`updated contenthash for italic(${file})`, 2);
                    logger.value("   previous", "n/a", 3);
                    logger.value("   new", chunk.contentHash.javascript, 3);
                }
                if (hashCurrent[chunkName] !==  chunk.contentHash.javascript)
                {
                    hashCurrent[chunkName] = chunk.contentHash.javascript;
                    logger.write(`updated stale contenthash for italic(${file})`, 2);
                    logger.value("   previous", hashCurrent[file], 3);
                    logger.value("   new", chunk.contentHash.javascript, 3);
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
        if (existsSync(env.paths.files.hashStoreJson))
        {
            const hashJson = readFileSync(env.paths.files.hashStoreJson, "utf8");
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
     * @param {WebpackCompilationAssets} assets
     */
    runtimeVars(assets)
    {
        const hashMap = this.env.state.hash.next,
              updates = /** @type {string[]} */([]);
        this.logger.write("replace runtime variables", 1);
		Object.entries(assets).filter(([ f, _ ]) => this.matchObject(f)).forEach(([ file, _ ]) =>
		{
            const asset = this.compilation.getAsset(file);
            if (asset && isString(asset.info.contenthash))
            {
                this.logger.value("   queued for variable replacement", file, 3);
                this.logger.write(`   ${file} queued for variable replacement`, 2);
                hashMap[this.fileNameStrip(file, true)] = asset.info.contenthash;
                if (this.canBeInitial(file)) {
                    updates.push(file);
                }
            }
        });
        // asArray(this.compilation.chunks).filter(c => isString(c.name)).forEach((chunk) =>
        // {
        //     const chunkName = /** @type {string} */(chunk.name);
        //     asArray(chunk.files).filter(f => this.matchObject(f)).forEach((file) =>
        //     {
        //         this.logger.value("   check file for variable replacement", file, 3);
        //         hashMap[chunkName] = chunk.contentHash.javascript;
        //         if (chunk.canBeInitial()) {
        //             this.logger.write(`   ${file} queued for variable replacement`, 2);
        //             updates.push(file);
        //         }
        //     });
        // });
        updates.forEach((f) => this.compilation.updateAsset(f, (s) => this.source(f, s), this.info.bind(this)));
        this.logger.write("runtime variable replacement completed", 2);
    };


    /**
     * @function Writes / caches asset content hashes to file
     * @private
     */
    saveAssetState()
    {
        this.logAssetInfo();
        writeFileSync(this.env.paths.files.hashStoreJson, JSON.stringify(this.env.state.hash, null, 4));
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
 * @returns {WpBuildRuntimeVarsPlugin | undefined}
 */
const runtimevars = (env) =>
    (env.app.plugins.runtimevars !== false && env.isExtension ? new WpBuildRuntimeVarsPlugin({ env }) : undefined);


module.exports = runtimevars;

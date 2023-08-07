/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/base.js
 * @author Scott Meesseman
 */

const { readFile } = require("fs/promises");
const { relative, basename } = require("path");
const { WebpackError, ModuleFilenameHelpers } = require("webpack");
const { globalEnv, isFunction, asArray, mergeIf, WpBuildCache, WpBuildConsoleLogger } = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackLogger} WebpackLogger */
/** @typedef {import("../types").WebpackSource} WebpackSource */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("../types").WebpackRawSource} WebpackRawSource */
/** @typedef {import("../types").WebpackCacheFacade} WebpackCacheFacade */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WpBuildPluginTapOptions} WpBuildPluginTapOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WebpackCompilationParams} WebpackCompilationParams */
/** @typedef {import("../types").WebpackStatsPrinterContext} WebpackStatsPrinterContext */
/** @typedef {import("../types").WebpackCompilationHookStage} WebpackCompilationHookStage */
/** @typedef {import("../types").WpBuildPluginTapOptionsHash} WpBuildPluginTapOptionsHash */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompiler>} WebpackSyncCompilerHook */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompiler>} WebpackAsyncCompilerHook */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompilation>} WebpackSyncCompilationHook */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompilation>} WebpackAsyncCompilationHook */
/** @typedef {{ file: string; snapshot?: WebpackSnapshot | null; source?: WebpackRawSource }} CacheResult */
/** @typedef {import("../types").RequireKeys<WpBuildPluginTapOptions, "stage" | "hookCompilation">} WpBuildPluginCompilationOptions */

/**
 * This callback is displayed as part of the Requester class.
 * @callback WpBuildPluginHookCallback
 * @param {...any} args
 * @returns {any}
 */


/**
 * @class WpBuildHashPlugin
 * @augments WebpackPluginInstance
 */
class WpBuildBasePlugin
{
    /**
     * @member {WpBuildCache} cache Persisitnet storage cache
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    cache;

    /**
     * @member {WebpackCompilation} compilation Webpack compilation instance
     * @memberof WpBuildBasePlugin.prototype
     * @type {WebpackCompilation}
     * @protected
     */
    compilation;

    /**
     * @member {WebpackCompiler} compiler
     * @type {WebpackCompiler} compiler
     * @protected
     */
    compiler;

    /**
     * @member {WpBuildEnvironment} env
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    env;

    /**
     * @member {number} hashDigestLength
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    hashDigestLength;

    /**
     * @member {WpBuildConsoleLogger} logger
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    logger;

    /**
     * @member {(str: string) => boolean} matchObject
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    matchObject;

    /**
     * @member {string} name
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    name;

    /**
     * @member {string} nameCompilation
     * @memberof WpBuildBasePlugin.prototype
     * @private
     */
    nameCompilation;

    /**
     * @member {WpBuildPluginOptions} options
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    options;

    /**
     * @member {WebpackPluginInstance[]} _plugins
     * @memberof WpBuildBasePlugin.prototype
     * @private
     */
    plugins;

    /**
     * @member {WebpackCacheFacade} wpCache Runtime compiler cache
     * @memberof WebpackCompiler.prototype
     * @protected
     * @type {WebpackCacheFacade}
     */
    wpCache;

    /**
     * @member {WebpackCacheFacade} wpCacheCompilation Runtime compilation cache
     * @memberof WpBuildBasePlugin.prototype
     * @type {WebpackCacheFacade}
     * @protected
     */
    wpCacheCompilation;

    /**
     * @member {WebpackConfig} wpConfig
     * @memberof WpBuildBasePlugin.prototype
     * @protected
     */
    wpConfig;

    /**
     * @member {WebpackLogger} wpLogger
     * @memberof WpBuildBasePlugin.prototype
     * @type {WebpackLogger}
     * @protected
     */
    wpLogger;


    /**
     * @class
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     * @param {string} [globalCache]
     */
	constructor(options, globalCache)
    {
        this.env = options.env;
        this.logger = this.env.logger;
        this.wpConfig = options.env.wpc;
        this.name = this.constructor.name;
        this.nameCompilation = this.constructor.name + "_";
        this.options = mergeIf(options, { plugins: [] });
        this.hashDigestLength = this.env.wpc.output.hashDigestLength || 20;
        this.cache = new WpBuildCache(this.env, { file: `cache_${this.name}.json` });
		this.matchObject = ModuleFilenameHelpers.matchObject.bind(undefined, options);
        if (globalCache) {
            this.initGlobalEnvObject(globalCache);
        }
        if (!options.registerVendorPluginsFirst) {
            this.plugins = [ this, ...asArray(options.plugins).map(p => new p.ctor(p.options)) ];
        }
        else {
            this.plugins = [ ...asArray(options.plugins).map(p => new p.ctor(p.options)), this ];
        }
    }


    /**
     * @function Called by webpack runtime to initialize this plugin.  To be overridden by inheriting class.
     * @memberof WpBuildBasePlugin.prototype
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler) { this.compiler = compiler; }


    /**
     * @function Break property name into separate spaced words at each camel cased character
     * @member breakProp
     * @private
     * @param {string} prop
     * @returns {string}
     */
    breakProp(prop)
    {
        return (prop.replace(/_/g, "")
                   .replace(/[A-Z]{2,}/g, (v) => v[0] + v.substring(1).toLowerCase())
                   .replace(/[a-z][A-Z]/g, (v) => `${v[0]} ${v[1]}`).toLowerCase());
    }


    /**
     * @function
     * @member checkSnapshot
     * @protected
     * @param {string} filePath
     * @param {string} identifier
     * @param {string} outputDir Output directory of build
     * @returns {Promise<CacheResult>}
     */
    async checkSnapshot(filePath, identifier, outputDir)
    {
        let data, /** @type {WebpackRawSource | undefined} */source, /** @type {CacheResult} */cacheEntry;
        const logger = this.logger,
              filePathRel = relative(outputDir, filePath),
              /** @type {CacheResult} */result = { file: basename(filePathRel), snapshot: null, source };

        logger.value("   check cache for existing asset", filePathRel, 3);

        try {
            cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
        }
        catch (e) {
            this.handleError(e, "failed while checking cache");
            return result;
        }

        if (cacheEntry && cacheEntry.snapshot)
        {
            let isValidSnapshot;
            logger.value("   check snapshot valid", filePathRel, 4);
            try {
                isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
            }
            catch (e) {
                this.handleError(e, "failed while checking snapshot");
                return result;
            }
            if (isValidSnapshot)
            {
                logger.value("   snapshot valid", filePathRel, 4);
                ({ source } = cacheEntry);
            }
            else {
                logger.write(`   snapshot for '${filePathRel}' is invalid`, 4);
            }
        }

        if (!source)
        {
            const startTime = Date.now();
            data = data || await readFile(filePath);
            source = new this.compiler.webpack.sources.RawSource(data);
            logger.value("   create snapshot", filePathRel, 4);
            try {
                result.snapshot = await this.createSnapshot(startTime, filePath);
            }
            catch (e) {
                this.handleError(e, "failed while creating snapshot");
                return result;
            }
            if (source && result.snapshot)
            {
                logger.value("   cache snapshot", filePathRel, 4);
                try {
                    const hash = this.getContentHash(source.buffer());
                    result.snapshot.setFileHashes(hash);
                    await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot: result.snapshot, hash });
                    result.source = source;
                }
                catch (e) {
                    this.handleError(e, "failed while caching snapshot");
                    return result;
                }
            }
        }

        return result;
    };


    /**
     * @function
     * @member checkSnapshotExists
     * @protected
     * @param {string} filePath
     * @param {string} identifier
     * @param {string} outputDir Output directory of build
     * @returns {Promise<boolean>}
     */
    async checkSnapshotExists(filePath, identifier, outputDir)
    {
        const logger = this.logger,
              filePathRel = relative(outputDir, filePath);
        let /** @type {CacheResult | undefined} */cacheEntry;
        logger.value("   check cache for existing asset snapshot", filePathRel, 3);
        try {
            cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
        }
        catch (e) {
            this.handleError(e, "failed while checking if cached snapshot exists");
        }
        return !!cacheEntry && !!cacheEntry.snapshot;
    };


	/**
	 * @function
	 * @member checkSnapshotValid
	 * @protected
	 * @param {WebpackSnapshot} snapshot
	 * @returns {Promise<boolean | undefined>}
	 */
	async checkSnapshotValid(snapshot)
	{
		return new Promise((resolve, reject) =>
		{
			this.compilation.fileSystemInfo.checkSnapshotValid(snapshot, (e, isValid) => { if (e) { reject(e); } else { resolve(isValid); }});
		});
	}


	/**
	 * @function
	 * @member createSnapshot
	 * @protected
	 * @param {number} startTime
	 * @param {string} dependency
	 * @returns {Promise<WebpackSnapshot | undefined | null>}
	 */
	async createSnapshot(startTime, dependency)
	{
		return new Promise((resolve, reject) =>
		{
			this.compilation.fileSystemInfo.createSnapshot(startTime, [ dependency ], // @ts-ignore
				undefined, undefined, null, (e, snapshot) => { if (e) { reject(e); } else { resolve(snapshot); }}
			);
		});
	}


	/**
	 * @function
	 * @member fileNameStrip
	 * @protected
	 * @param {string} file
	 * @param {boolean} [rmvExt] Remove file extension
	 * @returns {string}
	 */
    fileNameStrip = (file, rmvExt) =>
    {
        let newFile = file.replace(new RegExp(`\\.[a-f0-9]{${this.hashDigestLength},}`), "");
        if (rmvExt) {
            newFile = newFile.replace(/\.js(?:\.map)?/, "");
        }
        return newFile;
    };


	/**
	 * @function
	 * @member fileNameHashRegex
	 * @protected
	 * @returns {RegExp}
	 */
    fileNameHashRegex = () => new RegExp(`\\.[a-z0-9]{${this.hashDigestLength},}`);


	/**
	 * @function
	 * @member getContentHash
	 * @protected
	 * @param {Buffer} source
	 * @returns {string}
	 */
	getContentHash(source)
	{
		const {hashDigest, hashDigestLength, hashFunction, hashSalt } = this.compilation.outputOptions,
			  hash = this.compiler.webpack.util.createHash(/** @type {string} */hashFunction);
		if (hashSalt) {
			hash.update(hashSalt);
		}
		return hash.update(source).digest(hashDigest).toString().slice(0, hashDigestLength);
	}


    /**
     * @function getEntriesRegex
     * @member getEntriesRegex
     * @static
     * @param {WebpackConfig} wpConfig Webpack config object
     * @param {boolean} [dbg]
     * @param {boolean} [ext]
     * @param {boolean} [hash]
     * @returns {RegExp}
     */
    static getEntriesRegex = (wpConfig, dbg, ext, hash) =>
    {
        return new RegExp(
            `(?:${Object.keys(wpConfig.entry).reduce((e, c) => `${e ? e + "|" : ""}${c}`, "")})` +
            `(?:\\.debug)${!dbg ? "?" : ""}(?:\\.[a-z0-9]{${wpConfig.output.hashDigestLength || 20}})` +
            `${!hash ? "?" : ""}(?:\\.js|\\.js\\.map)${!ext ? "?" : ""}`
        );
    };


    /**
     * @function
     * @member getPlugins
     * @returns {(WebpackPluginInstance | InstanceType<WpBuildBasePlugin>)[]}
     */
    getPlugins() { return this.plugins; }


	/**
	 * @function
	 * @member handleError
	 * @protected
	 * @param {Error | WebpackError} e
	 * @param {string | undefined | null | false | 0} [msg]
	 */
	handleError(e, msg)
	{
		if (msg) {
            this.env.logger.error(msg);
        }
        else {
            this.env.logger.error("an error has occurred");
        }
        if (!(e instanceof WebpackError)) {
            e = new WebpackError(e.message);
        }
        this.env.logger.error(e);
        this.compilation.errors.push(/** @type {WebpackError} */(e));
	}


    /**
     * @function
     * @member initGlobalEnvObject
     * @protected
     * @param {string} baseProp
     * @param {any} [initialValue]
     * @param {...any} props
     */
    initGlobalEnvObject(baseProp, initialValue, ...props)
    {
        if (!globalEnv[baseProp]) {
            globalEnv[baseProp] = {};
        }
        props.filter(p => !globalEnv[baseProp][p]).forEach((p) => { globalEnv[baseProp][p] = initialValue; });
    };


    /**
     * @function
     * @member isAsync
     * @private
     * @param {any} hook
     * @returns {hook is WebpackAsyncCompilerHook | WebpackAsyncCompilationHook}
     */
    isAsync = (hook) => isFunction(hook.tapPromise);


    /**
     * @function
     * @member isEntryAsset
     * @protected
     * @param {string} file
     * @returns {boolean}
     */
    isEntryAsset = (file) => WpBuildBasePlugin.getEntriesRegex(this.wpConfig).test(file);


    /**
     * @function
     * @member isTapable
     * @private
     * @param {any} hook
     * @returns {hook is WebpackAsyncCompilerHook | WebpackAsyncCompilationHook}
     */
    isTapable = (hook) => isFunction(hook.tap) || isFunction(hook.tapPromise);


    /**
     * @function Called by extending class from apply()
     * @member onApply
     * @protected
     * @param {WebpackCompiler} compiler the compiler instance
     * @param {WpBuildPluginTapOptionsHash} options
     * @throws {WebpackError}
     */
    onApply(compiler, options)
    {
        let compilationHookTapped = false;
        const optionsArray = Object.entries(options);

        this.compiler = compiler;
        this.wpCache = compiler.getCache(this.name);
        this.wpLogger = compiler.getInfrastructureLogger(this.name);
        this.hashDigestLength = compiler.options.output.hashDigestLength || this.env.wpc.output.hashDigestLength || 20;

        for (const [ name, tapOpts ] of optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook))
        {
            if (tapOpts.hook === "compilation" && !compilationHookTapped)
            {
                this.tapCompilationHooks(optionsArray);
                compilationHookTapped = true;
            }
            else if (!tapOpts.async)
            {
                const hook = compiler.hooks[tapOpts.hook];
                hook.tap(`${this.name}_${name}`, this.wrapCallback(name, tapOpts).bind(this));
            }
            else
            {
                const hook = compiler.hooks[tapOpts.hook];
                if (this.isAsync(hook))
                {
                    hook.tapPromise(`${this.name}_${name}`, this.wrapCallback(name, tapOpts).bind(this));
                }
                else {
                    this.handleError(new WebpackError(`Invalid async hook parameters specified: ${tapOpts.hook}`));
                    return;
                }
            }
        }
    }


    /**
     * @function
     * @member onCompilation
     * @protected
     * @param {WebpackCompilation} compilation
     * @returns {boolean}
     */
    onCompilation(compilation)
    {
        this.compilation = compilation;
        this.wpLogger = compilation.getLogger(this.name);
        this.wpCacheCompilation = compilation.getCache(this.name);
        return !compilation.getStats().hasErrors();
    }


    /**
     * @function
     * @member tapCompilationHooks
     * @private
     * @param {[string, WpBuildPluginTapOptions][]} optionsArray
     */
    tapCompilationHooks(optionsArray)
    {
        this.compiler.hooks.compilation.tap(this.name, (compilation) =>
        {
            if (!this.onCompilation(compilation)) {
                return;
            }
            optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook === "compilation").forEach(([ name, tapOpts ]) =>
            {
                if (!tapOpts.hookCompilation)
                {
                    if (tapOpts.stage) {
                        tapOpts.hookCompilation = "processAssets";
                    }
                    else {
                        this.handleError(new WebpackError("Invalid hook parameters: stage and hookCompilation not specified"));
                        return;
                    }
                }
                else if (tapOpts.hookCompilation === "processAssets" && !tapOpts.stage)
                {
                    this.handleError(new WebpackError("Invalid hook parameters: stage not specified for processAssets"));
                    return;
                }
                this.tapCompilationStage(name, /** @type {WpBuildPluginCompilationOptions} */(tapOpts));
            });
        });
    }


    /**
     * @function
     * @member tapCompilationStage
     * @protected
     * @param {string} optionName
     * @param {WpBuildPluginCompilationOptions} options
     * @returns {void}
     * @throws {WebpackError}
     */
    tapCompilationStage(optionName, options)
    {
        const stageEnum = options.stage ? this.compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${options.stage}`] : null,
              name = `${this.name}_${options.stage}`,
              hook = this.compilation.hooks[options.hookCompilation];
        if (this.isTapable(hook))
        {
            if (stageEnum && options.hookCompilation === "processAssets")
            {
                const logMsg = this.breakProp(optionName).padEnd(this.env.app.log.pad.value - 3) + this.logger.tag(`processassets: ${options.stage} stage`);
                if (!options.async) {
                    hook.tap({ name, stage: stageEnum }, this.wrapCallback(logMsg, options).bind(this));
                }
                else {
                    hook.tapPromise({ name, stage: stageEnum }, this.wrapCallback(logMsg, options).bind(this));
                }
            }
            else
            {
                if (!options.async) {
                    hook.tap(name, this.wrapCallback(optionName, options).bind(this));
                }
                else {
                    if (this.isAsync(hook)) {
                        hook.tapPromise(name, this.wrapCallback(optionName, options).bind(this));
                    }
                    else {
                        this.handleError(new WebpackError(`Invalid async hook specified: ${options.hook}`));
                        return;
                    }
                }
            }
            if (options.statsProperty) {
                this.tapStatsPrinter(options.statsProperty, name);
            }
        }
    }


    /**
     * @function
     * @member tapStatsPrinter
     * @protected
     * @param {string} property
     * @param {string} name
     */
    tapStatsPrinter(property, name)
    {
        this.compilation.hooks.statsPrinter.tap(name, (stats) =>
        {
            const printFn = (/** @type {{}} */prop, /** @type {WebpackStatsPrinterContext} */context) =>
                prop ? context.green?.(context.formatFlag?.(this.breakProp(property)) || "") || "" : "";
            stats.hooks.print.for(`asset.info.${property}`).tap(name, printFn);
        });
    };


    /**
     * @function
     * @member wrapCallback
     * @private
     * @param {string} message If camel-cased, will be formatted with {@link breakProp}
     * @param {WpBuildPluginTapOptions} options
     * @returns {WpBuildPluginHookCallback}
     */
    wrapCallback(message, options)
    {
        const logger = this.logger,
              callback = options.callback,
              logMsg = this.breakProp(message);
        if (!options.async) {
            return (...args) => { logger.start(logMsg, 1); callback.call(this, ...args); };
        }
        return async (...args) => { logger.start(logMsg, 1); await callback.call(this, ...args); };
    }


    // /**
    //  * @template T
    //  * @function
    //  * @member wrapTry
    //  * @protected
    //  * @param {Function} fn
    //  * @param {string} msg
    //  * @param {...any} args
    //  * @returns {PromiseLike<T> | T | Error}
    //  */
    // wrapTry = (fn, msg, ...args) =>
    // {
    //     this.env.logger.write(msg, 3);
    //     try {
    //         const r = fn.call(this, ...args);
    //         if (isPromise(r)) {
    //             return r.then((v) => v);
    //         }
    //         else {
    //             return r;
    //         }
    //     }
    //     catch (e) {
    //         this.handleError(e, `Failed: ${msg}`);
    //         return /** @type {Error} */(e);
    //     }
    // };
}


module.exports = WpBuildBasePlugin;

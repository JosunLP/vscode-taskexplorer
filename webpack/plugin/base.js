/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.WpBuildBasePlugin
 */

const { WebpackError, ModuleFilenameHelpers } = require("webpack");
const { globalEnv, isFunction, asArray, mergeIf, WpBuildCache, WpBuildConsoleLogger } = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackLogger} WebpackLogger */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("../types").WebpackCacheFacade} WebpackCacheFacade */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WpBuildPluginTapOptions} WpBuildPluginTapOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WpBuildPluginApplyOptions} WpBuildPluginApplyOptions */
/** @typedef {import("../types").WebpackStatsPrinterContext} WebpackStatsPrinterContext */
/** @typedef {import("../types").WebpackCompilationHookStage} WebpackCompilationHookStage */
/** @typedef {import("../types").WpBuildPluginTapOptionsHash} WpBuildPluginTapOptionsHash */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompiler>} WebpackSyncCompilerHook */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompiler>} WebpackAsyncCompilerHook */
/** @typedef {import("../types").WpBuildPluginApplyOptionsHash} WpBuildPluginApplyOptionsHash */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompilation>} WebpackSyncCompilationHook */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompilation>} WebpackAsyncCompilationHook */
/** @typedef {import("../types").RequireKeys<WpBuildPluginApplyOptions, "stage" | "hookCompilation">} WpBuildPluginCompilationOptions */


/**
 * @class WpBuildHashPlugin
 * @abstract
 * @augments WebpackPluginInstance
 */
class WpBuildBasePlugin
{
    /**
     * @member cache Persisitnet storage cache
     * @protected
     * @type {WpBuildCache}
     */
    cache;

    /**
     * @member
     * @protected
     * @type {WebpackCompilation}
     */
    compilation;

    /**
     * @member
     * @protected
     * @type {WebpackCompiler}
     */
    compiler;

    /**
     * @member
     * @protected
     * @type {WpBuildEnvironment}
     */
    env;

    /**
     * @member
     * @protected
     * @type {number}
     */
    hashDigestLength;

    /**
     * @member
     * @protected
     * @type {WpBuildConsoleLogger}
     */
    logger;

    /**
     * @member
     * @protected
     * @type {(str: string) => boolean}
     */
    matchObject;

    /**
     * @member
     * @protected
     * @type {string}
     */
    name;

    /**
     * @member
     * @private
     * @type {string}
     */
    nameCompilation;

    /**
     * @member
     * @protected
     * @type {WpBuildPluginOptions}
     */
    options;

    /**
     * @private
     * @type {WebpackPluginInstance[]}
     */
    _plugins;

    /**
     * @member wpCache Runtime compiler cache
     * @protected
     * @type {WebpackCacheFacade}
     */
    wpCache;

    /**
     * @member wpCacheCompilation Runtime compilation cache
     * @protected
     * @type {WebpackCacheFacade}
     */
    wpCacheCompilation;

    /**
     * @member
     * @protected
     * @type {WebpackConfig}
     */
    wpConfig;

    /**
     * @member
     * @protected
     * @type {WebpackLogger}
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
        this.wpConfig = options.env.wpc;
        this.name = this.constructor.name;
        this.logger = this.env.logger;
        this.options = mergeIf(options, { plugins: [] });
        this.hashDigestLength = this.env.wpc.output.hashDigestLength || 20;
        this.cache = new WpBuildCache(this.env, { file: `cache_${this.name}.json` });
		this.matchObject = ModuleFilenameHelpers.matchObject.bind(undefined, options);
        if (globalCache) {
            this.initGlobalEnvObject(globalCache);
        }
        this._plugins = [ this, ...asArray(options.plugins).map(p => new p.ctor(p.options)) ];
    }


    /**
     * @function Called by webpack runtime to initialize this plugin.  To be overridden by inheriting class.
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler) { this.compiler = compiler; }


    /**
     * @function Break property name into separate spaced words at each camel cased character
     * @private
     * @param {string} prop
     * @returns {string}
     */
    breakProp(prop) { return prop.replace(/[A-Z]/g, (v) => ` ${v.toLowerCase()}`); }


    /**
     * @function
     * @protected
     * @param {string} file
     * @returns {boolean}
     */
    canBeInitial = (file) => WpBuildBasePlugin.getEntriesRegex(this.wpConfig).test(file);


	/**
	 * @function
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
	 * @protected
	 * @param {string} file
	 * @param {boolean} [rmvExt] Remove file extension
	 * @returns {string}
	 */
    fileNameStrip = (file, rmvExt) => file.replace(new RegExp(`(?:\\.[a-f0-9]{${this.hashDigestLength},})?${rmvExt ? "\\.js" : ""}`), "");

	/**
	 * @function
	 * @protected
	 * @returns {RegExp}
	 */
    fileNameHashRegex = () => new RegExp(`\\.[a-z0-9]{${this.hashDigestLength},}`);


	/**
	 * @function
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
     * @returns {WebpackPluginInstance[]}
     */
    getPlugins() { return this._plugins; }


	/**
	 * @function
	 * @protected
	 * @param {WebpackError} e
	 * @param {string | undefined | null | false | 0} [msg]
	 * @throws WebpackError
	 */
	handleError(e, msg)
	{
		this.env.logger.error((msg || "Error") + `: ${e.message.trim()}`);
        this.compilation.errors.push(/** @type {WebpackError} */e);
	}


    /**
     * @function
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


    // * @param {WebpackSyncCompilerHook | WebpackAsyncCompilerHook | WebpackSyncCompilationHook | WebpackAsyncCompilationHook} hook
    /**
     * @function
     * @private
     * @param {any} hook
     * @returns {hook is WebpackAsyncCompilerHook | WebpackAsyncCompilationHook}
     */
    isAsync = (hook) => isFunction(hook.tapPromise);


    /**
     * @function
     * @private
     * @param {any} hook
     * @returns {hook is WebpackAsyncCompilerHook | WebpackAsyncCompilationHook}
     */
    isTapable = (hook) => isFunction(hook.tap) || isFunction(hook.tapPromise);


    /**
     * @function
     * @protected
     * @param {string} hookMsg
     * @param {string} hookDsc
     */
    logHook = (hookMsg, hookDsc) => this.logger.valuestar(hookMsg, hookDsc);


    /**
     * @function Called by extending class from apply()
     * @protected
     * @param {WebpackCompiler} compiler the compiler instance
     * @param {WpBuildPluginApplyOptionsHash} options
     * @throws {WebpackError}
     */
    onApply(compiler, options)
    {
        const optionsArray = Object.entries(options);
        this.compiler = compiler;
        this.wpCache = compiler.getCache(this.name);
        this.wpLogger = compiler.getInfrastructureLogger(this.name);
        this.hashDigestLength = compiler.options.output.hashDigestLength || this.env.wpc.output.hashDigestLength || 20;
        for (const [ name, tapOpts ] of optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook))
        {
            const hook = compiler.hooks[tapOpts.hook];
            if (tapOpts.hook === "compilation")
            {
                this.tapCompilationHooks(optionsArray);
            }
            else if (!tapOpts.async)
            {
                hook.tap(`${this.name}_${name}`, tapOpts.callback.bind(this));
            }
            else
            {
                if (this.isAsync(hook))
                {
                    hook.tapPromise(`${this.name}_${name}`, tapOpts.callback.bind(this));
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
     * @protected
     * @param {WebpackCompilation} compilation
     * @returns {boolean}
     */
    onCompilation(compilation)
    {
        if (compilation.getStats().hasErrors()) {
            return false;
        }
        this.compilation = compilation;
        this.wpLlogger = compilation.getLogger(this.name);
        this.wpCacheCompilation = compilation.getCache(this.name);
        return true;
    }


    /**
     * @function
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
            optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook === "compilation").forEach(([ _, tapOpts ]) =>
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
                this.tapCompilationStage(/** @type {WpBuildPluginCompilationOptions} */(tapOpts));
            });
        });
    }


    /**
     * @function
     * @protected
     * @param {WpBuildPluginCompilationOptions} options
     * @returns {void}
     * @throws {WebpackError}
     */
    tapCompilationStage(options)
    {
        const stageEnum = options.stage ? this.compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${options.stage}`] : null,
              name = `${this.name}_${options.stage}`,
              hook = this.compilation.hooks[options.hookCompilation];
        if (this.isTapable(hook))
        {
            if (stageEnum && options.hookCompilation === "processAssets")
            {
                if (!options.async) {
                    hook.tap({ name, stage: stageEnum }, options.callback.bind(this));
                }
                else {
                    hook.tapPromise({ name, stage: stageEnum }, options.callback.bind(this));
                }
            }
            else
            {   if (!options.async) {
                    hook.tap(name, options.callback.bind(this));
                }
                else {
                    if (this.isAsync(hook)) {
                        hook.tapPromise(name, options.callback.bind(this));
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


    // /**
    //  * @template T
    //  * @function
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

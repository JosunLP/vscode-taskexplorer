/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module WpBuildBasePlugin
 */

const { globalEnv, merge } = require("../utils");
const { ModuleFilenameHelpers } = require("webpack");

/** @typedef {import("../types").WebpackLogger} WebpackLogger */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCacheFacade} WebpackCacheFacade */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildHashPlugin
 */
class WpBuildBasePlugin
{
    /**
     * @protected
     * @type {WebpackCacheFacade}
     */
    cache;

    /**
     * @protected
     * @type {WebpackCompilation}
     */
    compilation;

    /**
     * @protected
     * @type {WebpackCompiler}
     */
    compiler;

    /**
     * @protected
     * @type {WebpackLogger}
     */
    logger;

    /**
     * @protected
     * @type {(str: string) => boolean}
     */
    matchObject;

    /**
     * @protected
     * @type {string}
     */
    name;

    /**
     * @protected
     * @type {WpBuildPluginOptions}
     */
    options;


    /**
     * @class
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     * @param {string} [globalCache]
     */
	constructor(options, globalCache)
    {
        this.name = this.constructor.name;
        this.options = /** @type {WpBuildPluginOptions} */(merge({}, options));
		this.matchObject = ModuleFilenameHelpers.matchObject.bind(undefined, this.options);
        if (globalCache) {
            this.initGlobalEnvObject(globalCache);
        }
    }


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
     * @function Called by extending class from apply()
     * @protected
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    onApply(compiler)
    {
		this.compiler = compiler;
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
        this.cache = /** @type {WebpackCacheFacade} */(compilation.getCache(this.name));
        this.logger = /** @type {WebpackLogger} */(compilation.getLogger(this.name));
        return true;
    }


    // /**
    //  * @function Called by webpack runtime to apply this plugin
    //  * @param {string} hook
    //  * @param {WebpackCompiler} compiler the compiler instance
    //  * @param {Function} callback
    //  * @returns {void}
    //  */
    // tapCompilation(hook, compiler, callback)
    // {
	// 	this.onApply(compiler);
    //     /** @type {SyncSeriesHook} */compiler.hooks[hook].tap(this.name, async (compilation) =>
    //     {
    //         this.onCompilation(compilation);
    //         const stats = compilation.getStats();
    //         if (stats.hasErrors()) {
    //             return;
    //         }
    //         const statsJson = stats.toJson(),
    //               assets = statsJson.assets?.filter(a => a.type === "asset");
    //         if (assets) {
    //             callback(assets);
    //         }
    //     });
    // }


    // /**
    //  * @function Called by webpack runtime to apply this plugin
    //  * @param {string} hook
    //  * @param {WebpackCompiler} compiler the compiler instance
    //  * @param {Function} callback
    //  */
    // tapCompilationPromise(hook, compiler, callback)
    // {
	// 	this.onApply(compiler);
    //     compiler.hooks[hook].tapPromise(this.name, async (compilation) =>
    //     {
    //         this.onCompilation(compilation);
    //         const stats = compilation.getStats();
    //         if (stats.hasErrors()) {
    //             return;
    //         }
    //         const statsJson = stats.toJson(),
    //               assets = statsJson.assets?.filter(a => a.type === "asset");
    //         if (assets) {
    //             await callback(assets);
    //         }
    //     });
    // }


    /**
     * @function
     * @protected
     * @param {string} property
     * @param {string} name
     */
    tapStatsPrinter(property, name)
    {
        if (this.compilation.hooks.statsPrinter)
        {
            this.compilation.hooks.statsPrinter.tap(name, (stats) =>
            {
                stats.hooks.print.for(`asset.info.${property}`).tap(
                    name,
                    (istanbulTagged, { green, formatFlag }) => {
                        return istanbulTagged ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)(this.breakProp(property))) : "";
                    }
                );
            });
        }
    };

}


module.exports = WpBuildBasePlugin;

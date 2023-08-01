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
/** @typedef {import("../types").WpBuildPluginTapOptions} WpBuildPluginTapOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WpBuildPluginApplyOptions} WpBuildPluginApplyOptions */
/** @typedef {import("../types").WpBuildPluginTapOptionsHash} WpBuildPluginTapOptionsHash */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompiler>} WebpackSyncCompilerHook */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompiler>} WebpackAsyncCompilerHook */
/** @typedef {import("../types").WpBuildPluginApplyOptionsHash} WpBuildPluginApplyOptionsHash */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompilation>} WebpackSyncCompilationHook */
/** @typedef {import("../types").WpBuildPluginCompilationHookStage} WpBuildPluginCompilationHookStage */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompilation>} WebpackAsyncCompilationHook */


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
     * @param {Partial<WpBuildPluginOptions>} options Plugin options to be applied
     * @param {string} [globalCache]
     */
	constructor(options, globalCache)
    {
        this.name = this.constructor.name;
        this.options = this.getOptions(options);
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
     * @private
     * @param {Partial<WpBuildPluginOptions>} options
     * @returns {WpBuildPluginOptions}
     */
    getOptions(options)
    {
        return /** @type {WpBuildPluginOptions} */(merge({ env: {}, wpConfig: {}, hookCompiler: {}, hookCompilation: {}}, options));
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


    /**
     * @function Called by extending class from apply()
     * @protected
     * @param {WebpackCompiler} compiler the compiler instance
     * @param {WpBuildPluginApplyOptionsHash} options
     * @returns {void}
     */
    onApply(compiler, options)
    {
        this.compiler = compiler;
        const optionsArray = Object.entries(options),
              compilationHook = optionsArray.find(([ _, tapOpts ]) => tapOpts.hook === "compilation");
        if (compilationHook || optionsArray.every(([ _, tapOpts ]) => !!tapOpts.stage))
        {
            compiler.hooks.compilation.tap(this.name, (compilation) =>
            {
                if (!this.onCompilation(compilation)) {
                    return;
                }
                optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook === "compilation" && tapOpts.stage).forEach(([ _, tapOpts ]) =>
                {
                    if (!tapOpts.async) {
                        this.tapCompilationStage(tapOpts);
                    }
                    else {
                        this.tapCompilationStagePromise(tapOpts);
                    }
                });
            });
        }
        optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook !== "compilation" && !tapOpts.stage && tapOpts.hook).forEach(([ name, tapOpts ]) =>
        {
            if (!tapOpts.async) {
                compiler.hooks[tapOpts.hook].tap(`${this.name}_${name}`, tapOpts.callback.bind(this));
            }
            else {
                compiler.hooks[tapOpts.hook].tapPromise(`${this.name}_${name}`, tapOpts.callback.bind(this));
            }
        });
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
        this.logger = /** @type {WebpackLogger} */(compilation.getLogger(this.name));
        this.cache = /** @type {WebpackCacheFacade} */(compilation.getCache(this.name));
        return true;
    }


    /**
     * @function
     * @protected
     * @param {WpBuildPluginApplyOptions} options
     * @returns {void}
     */
    tapCompilationStage(options)
    {
        const stageEnum = this.compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${options.stage}`],
              name = `${this.name}_${options.stage}`;
        this.compilation.hooks.processAssets.tap({ name, stage: stageEnum }, options.callback.bind(this));
        if (options.statsProperty) {
            this.tapStatsPrinter(options.statsProperty, name);
        }
    }


    /**
     * @function
     * @protected
     * @param {WpBuildPluginApplyOptions} options
     * @returns {void}
     */
    tapCompilationStagePromise(options)
    {
        const stageEnum = this.compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${options.stage}`],
              name = `${this.name}_${options.stage}`;
        this.compilation.hooks.processAssets.tapPromise({ name, stage: stageEnum }, options.callback.bind(this));
        if (options.statsProperty) {
            this.tapStatsPrinter(options.statsProperty, name);
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
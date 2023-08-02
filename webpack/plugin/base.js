/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.WpBuildBasePlugin
 */

const { globalEnv, merge, asArray, mergeIf } = require("../utils");
const { ModuleFilenameHelpers } = require("webpack");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackLogger} WebpackLogger */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCacheFacade} WebpackCacheFacade */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {new(...args: any[]) => WebpackPluginInstance} WbBuildPluginCtor */
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
 * @abstract
 */
class WpBuildBasePlugin
{
    /**
     * @member
     * @protected
     * @type {WebpackCacheFacade}
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
     * @type {WebpackLogger}
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
     * @member
     * @protected
     * @type {WebpackConfig}
     */
    wpConfig;


    /**
     * @class
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     * @param {string} [globalCache]
     */
	constructor(options, globalCache)
    {
        this.env = options.env;
        this.wpConfig = options.wpConfig;
        this.name = this.constructor.name;
        this.options = mergeIf(options, { plugins: [] });
		this.matchObject = ModuleFilenameHelpers.matchObject.bind(undefined, options);
        if (globalCache) {
            this.initGlobalEnvObject(globalCache);
        }
        this._plugins = [ this, ...asArray(options.plugins).map(p => new p.ctor(p.options)) ];
    }


    /**
     * @function Called by webpack runtime to apply this plugin.  To be overridden by inheriting class.
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler) { this.compiler = compiler; }


    /**
     * @function
     * @returns {WebpackPluginInstance[]}
     */
    getPlugins() { return this._plugins; }


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
     * @param {WpBuildPluginApplyOptionsHash} options
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
                        return istanbulTagged ? green?.(formatFlag?.(this.breakProp(property)) || "") || "" : "";
                    }
                );
            });
        }
    };

}


module.exports = WpBuildBasePlugin;

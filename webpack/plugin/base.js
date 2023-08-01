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
/** @typedef {import("../types").WebpackSyncHook<WebpackCompiler>} WebpackSyncCompilerHook */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompiler>} WebpackAsyncCompilerHook */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompilation>} WebpackSyncCompilationHook */
/** @typedef {import("../types").WpBuildPluginCompilationHookStage} WpBuildPluginCompilationHookStage */
/** @typedef {import("../types").WebpackAsyncHook<WebpackCompilation>} WebpackAsyncCompilationHook */
/** @typedef {import("../types").WpBuildPluginCompilerHookCallback} WpBuildPluginCompilerHookCallback */
/** @typedef {import("../types").WpBuildPluginCompilationHookCallback} WpBuildPluginCompilationHookCallback */


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
     * @param {WpBuildPluginApplyOptions} options
     * @returns {void}
     */
    onApply(compiler, options)
    {
        this.compiler = compiler;
        const optionsArray = Object.entries(options),
              compilationHook = optionsArray.find(([ _, tapOptions ]) => tapOptions.hook === "compilation");
        if (compilationHook || optionsArray.every(([ _, tapOptions ]) => !!tapOptions.stage))
        {
            compiler.hooks.compilation.tap(this.name, (compilation) =>
            {
                if (!this.onCompilation(compilation)) {
                    return;
                }
                optionsArray.filter(([ _, tapOptions ]) => tapOptions.hook !== "compilation" && tapOptions.stage).forEach(([ _, tapOptions ]) =>
                {
                    this.tapCompilationStage(
                        /** @type {WpBuildPluginCompilationHookStage} */(tapOptions.stage),
                        compiler,
                        compilation,
                        tapOptions.statsProperty,
                        /** @type {WpBuildPluginCompilationHookCallback} */(tapOptions.callback)
                    );
                });
            });
        }
        optionsArray.filter(([ k, v ]) => k !== "compilation" && !v.stage && v.hook).forEach(([ name, tapOptions ]) =>
        {
            /** @type {WebpackSyncCompilerHook} */(compiler.hooks[tapOptions.hook]).tap(`${this.name}_${name}`, (compiler) =>
            {
                /** @type {WpBuildPluginCompilerHookCallback} */(tapOptions.callback)(compiler);
            });
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
     * @param {WpBuildPluginCompilationHookStage} stage
     * @param {WebpackCompiler} compiler the compiler instance
     * @param {WebpackCompilation} compilation the compiler instance
     * @param {string | null | undefined} statsProp
     * @param {(assets: WebpackCompilationAssets) => void} callback
     * @returns {void}
     */
    tapCompilationStage(stage, compiler, compilation, statsProp, callback)
    {
        const stageEnum = compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${stage}`],
              name = `${this.name}_${stage}`;
        compilation.hooks.processAssets.tap({ name, stage: stageEnum }, (assets) => callback(assets));
        if (statsProp) {
            this.tapStatsPrinter(statsProp, name);
        }
    }


    /**
     * @function
     * @protected
     * @param {number} stage
     * @param {WebpackCompiler} compiler the compiler instance
     * @param {WebpackCompilation} compilation the compiler instance
     * @param {string | null | undefined} statsProp
     * @param {(assets: WebpackCompilationAssets) => void} callback
     * @returns {void}
     */
    tapCompilationStagePromise(stage, compiler, compilation, statsProp, callback)
    {
        const name = `${this.name}${stage}`;
        compilation.hooks.processAssets.tap({ name, stage }, callback.bind(this));
        if (statsProp) {
            this.tapStatsPrinter(statsProp, name);
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

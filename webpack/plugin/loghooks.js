/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const WpBuildBasePlugin = require("./base");
const { colors, figures, globalEnv, writeInfo, withColor, withColorLength } = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @class WpBuildLogHookStagesPlugin
 */
class WpBuildLogHookStagesPlugin extends WpBuildBasePlugin
{
    /**
     * @class WpBuildLicenseFilePlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options, "hooksLog"); }

    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler, {});
		this.hookSteps();
    }

	/**
	 * @function
	 * @private
	 * @param {string} hook
	 * @param {(arg: any) => void} [cb]
	 */
	addCompilerHook(hook, cb)
	{
		this.compiler.hooks[hook].tap(`${this.name}_${hook}`, (/** @type {any} */arg) =>
		{
			this.writeBuildTag(hook);
			cb?.(arg);
		});
	};


	/**
	 * @function
	 * @private
	 * @param {string} hook
	 */
	addCompilerHookPromise(hook)
	{
		this.compiler.hooks[hook].tapPromise(`${hook}LogHookPromisePlugin`, async () => this.writeBuildTag(hook));
	};


	/**
	 * @function
	 * @private
	 */
	hookSteps()
	{
		const { env, wpConfig } = this.options;
		this.addCompilerHook("environment");
		this.addCompilerHook("afterEnvironment");
		this.addCompilerHook("entryOption");
		this.addCompilerHook("afterPlugins");
		this.addCompilerHook("afterResolvers");
		this.addCompilerHook("initialize");
		this.addCompilerHook("beforeRun");
		this.addCompilerHook("run");
		this.addCompilerHook("normalModuleFactory");
		this.addCompilerHook("contextModuleFactory");
		this.addCompilerHook("beforeCompile");
		this.addCompilerHook("compile");
		this.addCompilerHook("thisCompilation");
		this.addCompilerHook("compilation", (_compilation) =>
		{
			// const compilation = /** @type {WebpackCompilation} */(arg);
			// compilation.hooks.beforeModuleHash.tap(
			// 	"LogCompilationHookBeforeModuleHashPlugin",
			// 	() => writeBuildTag("compilation.beforeModuleHash", env, wpConfig)
			// );
			// compilation.hooks.afterModuleHash.tap(
			// 	"LogCompilationHookAftereModuleHashPlugin",
			// 	() => writeBuildTag("compilation.afterModuleHash", env, wpConfig)
			// );
			// compilation.hooks.processAssets.tap(
			// 	{
			// 		name: "LogCompilationHookPluginAdditions",
			// 		stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
			// 	},
			// 	() => writeBuildTag("compilation.additions", env, wpConfig)
			// );
			// compilation.hooks.processAssets.tap(
			// 	{
			// 		name: "LogCompilationHookPluginAdditional",
			// 		stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
			// 	},
			// 	() => writeBuildTag("compilation.additional", env, wpConfig)
			// );
		});
		this.addCompilerHook("make");
		this.addCompilerHook("afterCompile");
		this.addCompilerHook("shouldEmit");
		this.addCompilerHook("emit");
		this.addCompilerHookPromise("assetEmitted");
		this.addCompilerHook("emit");
		this.addCompilerHook("afterEmit");
		this.addCompilerHook("done");
		this.addCompilerHook("shutdown");
		this.addCompilerHook("afterDone");
		this.addCompilerHook("additionalPass");
		this.addCompilerHook("failed", /** @param {Error} e */(e) =>
		{
			writeInfo(" ", figures.color.error);
			writeInfo("Error Details:", figures.color.error);
			writeInfo(`   ${e.message}`, figures.color.error);
			writeInfo(" ", figures.color.error);
		});
		this.addCompilerHook("invalid");
		this.addCompilerHook("watchRun");
		this.addCompilerHook("watchClose");
	}


	/**
	 * @function
	 * @private
	 * @param {string} hook
	 */
	writeBuildTag(hook)
	{
		const { env, wpConfig } = this.options,
			  key = hook + wpConfig.name;
		if (!globalEnv.hooksLog[key])
		{
			globalEnv.hooksLog[key] = true;
			const hookName = `${withColor(figures.star, colors.cyan)} ${hook} ${withColor(figures.star, colors.cyan)}`;
			writeInfo(`hook [${withColor(env.build, colors.italic)}][${withColor(wpConfig.target.toString(), colors.italic)}]`
					  .padEnd(env.app.logPad.value + (withColorLength(colors.italic) * 2)) + hookName);
		}
	};

}


/**
 * @function hookSteps
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WpBuildLogHookStagesPlugin | undefined}
 */
const loghooks = (env, wpConfig) =>
	(env.app.plugins.loghooks !== false ? new WpBuildLogHookStagesPlugin({ env, wpConfig }) : undefined);


module.exports = loghooks;

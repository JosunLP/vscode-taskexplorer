/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file plugin/loghooks.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman
 */

const { globalEnv } = require("../utils");
const WpBuildBasePlugin = require("./base");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackCompilerHook} WebpackCompilerHook */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilerSyncHook} WebpackCompilerSyncHook */
/** @typedef {import("../types").WebpackCompilerHookName} WebpackCompilerHookName */
/** @typedef {import("../types").WebpackCompilerSyncHookName} WebpackCompilerSyncHookName */
/** @typedef {import("../types").WebpackCompilerAsyncHookName} WebpackCompilerAsyncHookName */
/** @typedef {import("../types").WebpackSyncHook<any>} WebpackSyncHook */


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
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
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
	 * @param {WebpackCompilerHookName} hook
	 * @param {(arg: any) => any} [cb]
	 */
	addCompilerHook(hook, cb)
	{
		this.compiler.hooks[hook].tap(`${this.name}_${hook}`, (/** @type {any} */arg) =>
		{
			this.writeBuildTag(hook);
			return cb?.(arg);
		});
	};


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilerAsyncHookName} hook
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
		this.addCompilerHook("afterCompile", /** @param {WebpackCompilation} compilation */(compilation) =>
		{
			// const stats = compilation.getStats();
			// stats.toJson().
			const assets = compilation.getAssets();
			this.logger.write(
				"---- Compilation step completed -- Listing all assets ----------------------------------------",
				3, "", null, this.logger.colors.white
			);
			for (const asset of assets)
			{
				this.logger.write(
					this.logger.tag("ASSET", this.logger.colors.green, this.logger.colors.white) + " " +
					this.logger.withColor(asset.name, this.logger.colors.grey),
					3
				);
				this.logger.value("   asset info", JSON.stringify(asset.info), 4);
			}
		});
		this.addCompilerHook("shouldEmit");
		this.addCompilerHook("emit");
		this.addCompilerHookPromise("assetEmitted");
		this.addCompilerHook("emit");
		this.addCompilerHook("afterEmit");
		this.addCompilerHook("done");
		this.addCompilerHook("shutdown");
		this.addCompilerHook("afterDone");
		this.addCompilerHook("additionalPass");
		this.addCompilerHook("failed", /** @param {Error} e */(e) => void this.logger.error(e));
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
		const key = hook +this.env.wpc.name;
		if (!globalEnv.hooksLog[key])
		{
			globalEnv.hooksLog[key] = true;
			this.logger.valuestar("build stage hook", hook);
		}
	};

}


/**
 * @function hookSteps
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildLogHookStagesPlugin | undefined}
 */
const loghooks = (env) =>
	(env.app.plugins.loghooks !== false ? new WpBuildLogHookStagesPlugin({ env, wpConfig: env.wpc }) : undefined);


module.exports = loghooks;

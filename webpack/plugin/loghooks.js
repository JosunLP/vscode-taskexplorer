/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { globalEnv } = require("../utils/global");
const { initGlobalEnvObject } = require("../utils/utils");
const { writeInfo, withColor, figures, colors, withColorLength } = require("../utils/console");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function addCompilerHook
 * @param {string} hook
 * @param {WebpackPluginInstance[]} plugins
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @param {(arg: any) => void} [cb]
 */
const addCompilerHook = (hook, plugins, env, wpConfig, cb) =>
{
	plugins.push({
		apply: (compiler) =>
		{
			compiler.hooks[hook].tap(`${hook}LogHookPlugin`, (/** @type {any} */arg) =>
			{
				writeBuildTag(hook, env, wpConfig);
				if (cb) {
					cb(arg);
				}
			});
		}
	});
};



/**
 * @function addCompilerHook
 * @param {string} hook
 * @param {WebpackPluginInstance[]} plugins
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const addCompilerHookPromise = (hook, plugins, env, wpConfig) =>
{
	plugins.push({
		apply: (compiler) =>
		{
			compiler.hooks[hook].tapPromise(`${hook}LogHookPromisePlugin`, async () => writeBuildTag(hook, env, wpConfig));
		}
	});
};


/**
 * @function hookSteps
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance[]}
 */
const hookSteps = (env, wpConfig) =>
{
	/** @type {WebpackPluginInstance[]} */
	const plugins = [];
	if (env.app.plugins.loghooks !== false)
	{
		initGlobalEnvObject("hooksLog");
		addCompilerHook("environment", plugins, env, wpConfig);
		addCompilerHook("afterEnvironment", plugins, env, wpConfig);
		addCompilerHook("entryOption", plugins, env, wpConfig);
		addCompilerHook("afterPlugins", plugins, env, wpConfig);
		addCompilerHook("afterResolvers", plugins, env, wpConfig);
		addCompilerHook("initialize", plugins, env, wpConfig);
		addCompilerHook("beforeRun", plugins, env, wpConfig);
		addCompilerHook("run", plugins, env, wpConfig);
		addCompilerHook("normalModuleFactory", plugins, env, wpConfig);
		addCompilerHook("contextModuleFactory", plugins, env, wpConfig);
		addCompilerHook("beforeCompile", plugins, env, wpConfig);
		addCompilerHook("compile", plugins, env, wpConfig);
		addCompilerHook("thisCompilation", plugins, env, wpConfig);
		addCompilerHook("compilation", plugins, env, wpConfig, (compilation) =>
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
		addCompilerHook("make", plugins, env, wpConfig);
		addCompilerHook("afterCompile", plugins, env, wpConfig);
		addCompilerHook("shouldEmit", plugins, env, wpConfig);
		addCompilerHook("emit", plugins, env, wpConfig);
		addCompilerHookPromise("assetEmitted", plugins, env, wpConfig);
		addCompilerHook("emit", plugins, env, wpConfig);
		addCompilerHook("afterEmit", plugins, env, wpConfig);
		addCompilerHook("done", plugins, env, wpConfig);
		addCompilerHook("shutdown", plugins, env, wpConfig);
		addCompilerHook("afterDone", plugins, env, wpConfig);
		addCompilerHook("additionalPass", plugins, env, wpConfig);
		addCompilerHook("failed", plugins, env, wpConfig, /** @param {Error} e */(e) =>
		{
			writeInfo("Error Details:", figures.color.error);
			writeInfo(e.message, figures.color.error, "   ");
		});
		addCompilerHook("invalid", plugins, env, wpConfig);
		addCompilerHook("watchRun", plugins, env, wpConfig);
		addCompilerHook("watchClose", plugins, env, wpConfig);
	}
	return plugins;
};


/**
 * @function writeBuildTag
 * @param {string} hook
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const writeBuildTag = (hook, env, wpConfig) =>
{
	const key = hook + wpConfig.name;
	if (!globalEnv.hooksLog[key])
	{
		globalEnv.hooksLog[key] = true;
		const hookName = `${withColor(figures.star, colors.cyan)} ${hook} ${withColor(figures.star, colors.cyan)}`;
		writeInfo(`[${withColor(env.build, colors.italic)}][${withColor(wpConfig.target.toString(), colors.italic)}]`
				  .padEnd(env.app.logPad.plugin.loghooks.buildTag + (withColorLength(colors.italic) * 2)) + hookName);
	}
};


module.exports = hookSteps;

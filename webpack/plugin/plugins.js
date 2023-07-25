/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const globalEnv = require("../global");
const { writeInfo, withColor, figures, colors } = require("../console");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */

const hookNamePad = 46;


/**
 * @method addStepHook
 * @param {String} hook
 * @param {WebpackPluginInstance[]} plugins
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const addStepHook = (hook, plugins, env, wpConfig) =>
{
	plugins.push({
		apply: (compiler) =>
		{
			const buildName = withColor(/** @type {String} */(wpConfig.name), colors.grey),
				  hookName = `${withColor(figures.star, colors.cyan)} ${hook} ${withColor(figures.star, colors.cyan)}`;
			compiler.hooks[hook].tap(`${hook}StepPlugin`, () => writeInfo(`Build step: ${hookName.padEnd(hookNamePad)} ${buildName}`));
			// compiler.hooks[hook].tap(`${hook}StepPlugin`, () => writeInfo(`${hookName} ${buildName}`));
		}
	});
};


/**
 * @method addStepHook
 * @param {String} hook
 * @param {WebpackPluginInstance[]} plugins
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const addStepHookAsync = (hook, plugins, env, wpConfig) =>
{
	plugins.push({
		apply: (compiler) =>
		{
			const buildName = withColor(/** @type {String} */(wpConfig.name), colors.grey),
				  hookName = `${withColor(figures.star, colors.cyan)} ${hook} ${withColor(figures.star, colors.cyan)}`;
			compiler.hooks[hook].tapPromise(`${hook}StepPlugin`, async () => writeInfo(`Build step: ${hookName.padEnd(hookNamePad)} ${buildName}`));
		}
	});
};


/**
 * @method hookSteps
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance[]}
 */
const hookSteps = (env, wpConfig) =>
{
	/** @type {WebpackPluginInstance[]} */
	const plugins = [];
	addStepHook("environment", plugins, env, wpConfig);
	addStepHook("afterEnvironment", plugins, env, wpConfig);
	addStepHook("entryOption", plugins, env, wpConfig);
	addStepHook("afterPlugins", plugins, env, wpConfig);
	addStepHook("afterResolvers", plugins, env, wpConfig);
	addStepHook("initialize", plugins, env, wpConfig);
	addStepHook("beforeRun", plugins, env, wpConfig);
	addStepHook("run", plugins, env, wpConfig);
	addStepHook("watchRun", plugins, env, wpConfig);
	addStepHook("normalModuleFactory", plugins, env, wpConfig);
	addStepHook("contextModuleFactory", plugins, env, wpConfig);
	addStepHook("beforeCompile", plugins, env, wpConfig);
	addStepHook("compile", plugins, env, wpConfig);
	addStepHook("thisCompilation", plugins, env, wpConfig);
	addStepHook("compilation", plugins, env, wpConfig);
	addStepHook("make", plugins, env, wpConfig);
	addStepHook("afterCompile", plugins, env, wpConfig);
	addStepHook("shouldEmit", plugins, env, wpConfig);
	addStepHook("emit", plugins, env, wpConfig);
	addStepHook("afterEmit", plugins, env, wpConfig);
	addStepHookAsync("assetEmitted", plugins, env, wpConfig);
	addStepHook("emit", plugins, env, wpConfig);
	addStepHook("done", plugins, env, wpConfig);
	addStepHook("afterDone", plugins, env, wpConfig);
	addStepHook("additionalPass", plugins, env, wpConfig);
	addStepHook("failed", plugins, env, wpConfig);
	addStepHook("invalid", plugins, env, wpConfig);
	addStepHook("watchClose", plugins, env, wpConfig);
	addStepHook("shutdown", plugins, env, wpConfig);
	return plugins;
};


module.exports = hookSteps;

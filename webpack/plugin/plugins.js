/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { writeInfo, withColor, figures, colors } = require("../console");

// const TerserPlugin = require("terser-webpack-plugin");
// const ShebangPlugin = require("webpack-shebang-plugin");
// const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// const FilterWarningsPlugin = require("webpack-filter-warnings-plugin");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method addStepHook
 * @param {String} hook
 * @param {WebpackPluginInstance[]} plugins
 * @param {WebpackEnvironment} env
 */
const addStepHook = (hook, plugins, env) =>
{
	plugins.push({
		apply: /** @param {WebpackCompiler} compiler*/(compiler) =>
		{
			const hookName = `${withColor(figures.star, colors.cyan)} ${hook} ${withColor(figures.star, colors.cyan)}`;
			compiler.hooks[hook].tap(`${hook}StepPlugin`, () => writeInfo(`Build step: ${hookName}`));
		}
	});
};


/**
 * @method addStepHook
 * @param {String} hook
 * @param {WebpackPluginInstance[]} plugins
 * @param {WebpackEnvironment} env
 */
const addStepHookAsync = (hook, plugins, env) =>
{
	plugins.push({
		apply: /** @param {WebpackCompiler} compiler*/(compiler) =>
		{
			const hookName = `${withColor(figures.star, colors.cyan)} ${hook} ${withColor(figures.star, colors.cyan)}`;
			compiler.hooks[hook].tapPromise(`${hook}StepPlugin`, async () => writeInfo(`Build step: ${hookName}`));
		}
	});
};


/**
 * @method hookSteps
 * @param {WebpackEnvironment} env
 * @returns {WebpackPluginInstance[]}
 */
const hookSteps = (env) =>
{
	/** @type {WebpackPluginInstance[]} */
	const plugins = [];
	addStepHook("environment", plugins, env);
	addStepHook("afterEnvironment", plugins, env);
	addStepHook("entryOption", plugins, env);
	addStepHook("afterPlugins", plugins, env);
	addStepHook("afterResolvers", plugins, env);
	addStepHook("initialize", plugins, env);
	addStepHook("beforeRun", plugins, env);
	addStepHook("run", plugins, env);
	addStepHook("watchRun", plugins, env);
	addStepHook("normalModuleFactory", plugins, env);
	addStepHook("contextModuleFactory", plugins, env);
	addStepHook("beforeCompile", plugins, env);
	addStepHook("compile", plugins, env);
	addStepHook("thisCompilation", plugins, env);
	addStepHook("compilation", plugins, env);
	addStepHook("make", plugins, env);
	addStepHook("afterCompile", plugins, env);
	addStepHook("shouldEmit", plugins, env);
	addStepHook("emit", plugins, env);
	addStepHook("afterEmit", plugins, env);
	addStepHookAsync("assetEmitted", plugins, env);
	addStepHook("emit", plugins, env);
	addStepHook("done", plugins, env);
	addStepHook("afterDone", plugins, env);
	addStepHook("additionalPass", plugins, env);
	addStepHook("failed", plugins, env);
	addStepHook("invalid", plugins, env);
	addStepHook("watchClose", plugins, env);
	addStepHook("shutdown", plugins, env);
	return plugins;
};


module.exports = hookSteps;

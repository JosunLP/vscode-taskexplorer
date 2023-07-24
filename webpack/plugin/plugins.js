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
			compiler.hooks[hook].tap(`${hook}StepPlugin`, () => writeInfo(`Hooked build step: ${hookName}`));
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
	const plugins = [], _env = { ...env };
	addStepHook("environment", plugins, _env);
	addStepHook("afterEnvironment", plugins, _env);
	addStepHook("entryOption", plugins, _env);
	addStepHook("afterPlugins", plugins, _env);
	addStepHook("afterResolvers", plugins, _env);
	addStepHook("initialize", plugins, _env);
	addStepHook("beforeRun", plugins, _env);
	addStepHook("run", plugins, _env);
	addStepHook("watchRun", plugins, _env);
	addStepHook("normalModuleFactory", plugins, _env);
	addStepHook("contextModuleFactory", plugins, _env);
	addStepHook("beforeCompile", plugins, _env);
	addStepHook("compile", plugins, _env);
	addStepHook("thisCompilation", plugins, _env);
	addStepHook("compilation", plugins, _env);
	addStepHook("make", plugins, _env);
	addStepHook("afterCompile", plugins, _env);
	addStepHook("shouldEmit", plugins, _env);
	addStepHook("emit", plugins, _env);
	addStepHook("afterEmit", plugins, _env);
	addStepHook("assetEmitted", plugins, _env);
	addStepHook("emit", plugins, _env);
	addStepHook("done", plugins, _env);
	addStepHook("additionalPass", plugins, _env);
	addStepHook("failed", plugins, _env);
	addStepHook("invalid", plugins, _env);
	addStepHook("watchClose", plugins, _env);
	addStepHook("shutdown", plugins, _env);
	return plugins;
};


module.exports = hookSteps;

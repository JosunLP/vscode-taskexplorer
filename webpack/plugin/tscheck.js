/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.tscheck
 */

const path = require("path");
const ForkTsCheckerPlugin = require("fork-ts-checker-webpack-plugin");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {(ForkTsCheckerPlugin)[]}
 */
const tscheck = (env, wpConfig) =>
{
	const plugins = [];
	if (env.build === "webview")
	{
		plugins.push(
			new ForkTsCheckerPlugin(
			{
				async: false,
				formatter: "basic",
				typescript: {
					configFile: path.join(env.basePath, "tsconfig.json"),
				}
			})
		);
	}
	else if (env.build === "tests")
	{
		plugins.push(
			new ForkTsCheckerPlugin(
			{
				async: false,
				formatter: "basic",
				typescript: {
					// build: true,
					mode: "write-tsbuildinfo",
					configFile: path.join(env.buildPath, "src", "test", "tsconfig.json"),
				}
			})
		);
	}
	else
	{
		plugins.push(
			new ForkTsCheckerPlugin(
			{
				async: false,
				formatter: "basic",
				typescript: {
					// build: true,
					mode: "write-tsbuildinfo",
					configFile: path.join(env.buildPath, env.build === "browser" ? "tsconfig.browser.json" : "tsconfig.json"),
				}
			})
		);
	}
	return plugins;
};


module.exports = tscheck;

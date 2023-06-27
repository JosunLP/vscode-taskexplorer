// @ts-check

/**
 * @module webpack.exports.externals
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */

// eslint-disable-next-line import/no-extraneous-dependencies
const nodeExternals = require("webpack-node-externals");


/**
 * @method
 * The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot
 * be webpack'ed, -> https://webpack.js.org/configuration/externals/
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const externals = (env, wpConfig) =>
{
	if (env.build !== "tests")
	{
		wpConfig.externals = { vscode: "commonjs vscode" };
	}
	else {
		wpConfig.externals = [
			{ vscode: "commonjs vscode" },
			// { nyc: "commonjs nyc" },
			/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
		];
	}
	// if (env.build === "webview")
	// {
	// 	wpConfig.externals = { vscode: "commonjs vscode" };
	// }
	// else if (env.environment === "test")
	// {
	// 	wpConfig.externals = [
	// 		{ vscode: "commonjs vscode" },
	// 		{ nyc: "commonjs nyc" },
	// 		/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
	// 	];
	// }
	// else {
	// 	wpConfig.externals = { vscode: "commonjs vscode" };
	// }
	if (env.build === "webview"|| env.build === "browser") {
		wpConfig.externalsPresets = { web: true };
	}
	else {
		wpConfig.externalsPresets = { node: true };
	}
};

module.exports = externals;

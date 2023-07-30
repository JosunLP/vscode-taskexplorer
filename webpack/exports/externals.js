// @ts-check

/**
 * @module webpack.exports.externals
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

// eslint-disable-next-line import/no-extraneous-dependencies
const nodeExternals = require("webpack-node-externals");


/**
 * @function
 * The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot
 * be webpack'ed, -> https://webpack.js.org/configuration/externals/
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const externals = (env, wpConfig) =>
{
	if (env.app.exports.externals !== false)
	{
		if (env.app.vscode)
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
		}
		else if (env.build !== "tests")
		{
			wpConfig.externals = [
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
		// wpConfig.externalsType = "commonjs2";
		if (env.isWeb) {
			wpConfig.externalsPresets = { web: true };
		}
		else {
			wpConfig.externalsPresets = { node: true };
		}
	}
};


module.exports = externals;

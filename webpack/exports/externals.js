// @ts-check

/**
 * @module wpbuild.exports.externals
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

// eslint-disable-next-line import/no-extraneous-dependencies
const nodeExternals = require("webpack-node-externals");


/**
 * @function
 * The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot
 * be webpack'ed, -> https://webpack.js.org/configuration/externals/
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const externals = (env) =>
{
	if (env.app.exports.externals !== false)
	{
		if (env.app.vscode)
		{
			if (env.build !== "tests")
			{
				env.wpc.externals = { vscode: "commonjs vscode" };
			}
			else {
				env.wpc.externals = [
					{ vscode: "commonjs vscode" },
					// { nyc: "commonjs nyc" },
					/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
				];
			}
		}
		else if (env.build !== "tests" && env.build !== "types")
		{
			env.wpc.externals = [
				/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
			];
		}
		// if (env.build === "webview")
		// {
		// 	env.wpc.externals = { vscode: "commonjs vscode" };
		// }
		// else if (env.environment === "test")
		// {
		// 	env.wpc.externals = [
		// 		{ vscode: "commonjs vscode" },
		// 		{ nyc: "commonjs nyc" },
		// 		/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
		// 	];
		// }
		// else {
		// 	env.wpc.externals = { vscode: "commonjs vscode" };
		// }
		// env.wpc.externalsType = "commonjs2";
		if (env.isWeb) {
			env.wpc.externalsPresets = { web: true };
		}
		else {
			env.wpc.externalsPresets = { node: true };
		}
	}
};


module.exports = externals;

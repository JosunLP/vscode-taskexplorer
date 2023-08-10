// @ts-check

/**
 * @file exports/extenals.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../types").WpBuildApp} WpBuildApp */

// eslint-disable-next-line import/no-extraneous-dependencies
const nodeExternals = require("webpack-node-externals");


/**
 * @function
 * The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot
 * be webpack'ed, -> https://webpack.js.org/configuration/externals/
 * @param {WpBuildApp} app Webpack build environment
 */
const externals = (app) =>
{
	if (app.rc.exports.externals !== false)
	{
		if (app.rc.vscode)
		{
			if (app.build !== "tests")
			{
				app.wpc.externals = { vscode: "commonjs vscode" };
			}
			else {
				app.wpc.externals = [
					{ vscode: "commonjs vscode" },
					// { nyc: "commonjs nyc" },
					/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
				];
			}
		}
		else if (app.build !== "tests" && app.build !== "types")
		{
			app.wpc.externals = [
				/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
			];
		}
		// if (app.build === "webview")
		// {
		// 	app.wpc.externals = { vscode: "commonjs vscode" };
		// }
		// else if (app.environment === "test")
		// {
		// 	app.wpc.externals = [
		// 		{ vscode: "commonjs vscode" },
		// 		{ nyc: "commonjs nyc" },
		// 		/** @type {import("webpack").WebpackPluginInstance}*/(nodeExternals())
		// 	];
		// }
		// else {
		// 	app.wpc.externals = { vscode: "commonjs vscode" };
		// }
		// app.wpc.externalsType = "commonjs2";
		if (app.isWeb) {
			app.wpc.externalsPresets = { web: true };
		}
		else {
			app.wpc.externalsPresets = { node: true };
		}
	}
};


module.exports = externals;

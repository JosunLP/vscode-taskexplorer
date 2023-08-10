/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/analyze.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const webpack = require("webpack");
const VisualizerPlugin = require("webpack-visualizer-plugin2");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


// /**
//  * @param {WpBuildApp} app
//  * @param {WebpackConfig} wpConfig Webpack config object
//  * @returns {(WebpackPluginInstance | undefined)[]}
//  */
// const analyze = (env, wpConfig) =>
// {
//     const plugins = [];
// 	if (app.build !== "tests")
// 	{
// 		plugins.push(
// 			bundle(env, wpConfig),
// 			visualizer(env, wpConfig),
// 			circular(env, wpConfig)
// 		);
// 	}
// 	return plugins;
// };

const analyze =
{
	/**
	 * @param {WpBuildApp} app
	 * @returns {BundleAnalyzerPlugin | undefined}
	 */
	bundle(app)
	{
		let plugin;
		if (app.rc.plugins.analyze !== false && app.analyze === true && app.build !== "tests" && app.build !== "webview")
		{
			plugin = new BundleAnalyzerPlugin({
				analyzerPort: "auto",
				analyzerMode: "static",
				generateStatsFile: true,
				statsFilename: "../.coverage/analyzer-stats.json",
				reportFilename: "../.coverage/analyzer.html",
				openAnalyzer: true
			});
		}
		return plugin;
	},

	/**
	 * @param {WpBuildApp} app
	 * @returns {CircularDependencyPlugin | undefined}
	 */
	circular(app)
	{
		let plugin;
		if (app.rc.plugins.analyze !== false  && app.analyze === true && app.build !== "tests" && app.build !== "webview")
		{
			plugin = new CircularDependencyPlugin(
			{
				cwd: app.rc.paths.build,
				exclude: /node_modules/,
				failOnError: false,
				onDetected: ({ module: _webpackModuleRecord, paths, compilation }) =>
				{
					compilation.warnings.push(/** @type {*}*/(new webpack.WebpackError(paths.join(" -> "))));
				}
			});
		}
		return plugin;
	},

	/**
	 * @param {WpBuildApp} app
	 * @returns {VisualizerPlugin | undefined}
	 */
	visualizer(app)
	{
		let plugin;
		if (app.rc.plugins.analyze !== false && app.analyze === true && app.build !== "tests" && app.build !== "webview") {
			plugin = new VisualizerPlugin({ filename: "../.coverage/visualizer.html" });
		}
		return /** @type {VisualizerPlugin | undefined}) */(plugin);
	}
};


module.exports = analyze;

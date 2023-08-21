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

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
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
		if (app.rc.args.analyze)
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
		if (app.rc.args.analyze)
		{
			plugin = new CircularDependencyPlugin(
			{
				cwd: app.getRcPath("base"),
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
	 * @returns {InstanceType<VisualizerPlugin> | undefined}
	 */
	visualizer(app)
	{
		let plugin;
		if (app.rc.args.analyze) {
			plugin = new VisualizerPlugin({ filename: "../.coverage/visualizer.html" });
		}
		return plugin;
	}
};


module.exports = analyze;

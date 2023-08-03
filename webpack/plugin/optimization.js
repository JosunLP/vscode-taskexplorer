/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.optimization
 */

const webpack = require("webpack");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function optimization
 * @param {WpBuildEnvironment} env Webpack build environment
 * @returns {WebpackPluginInstance[]}
 */
const optimization = (env) =>
{
	const plugins = [];
	if (env.app.plugins.optimization !== false)
	{
		if (env.build === "browser")
		{
			plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));
		}
		if (env.build !== "webview")
		{
			plugins.push(new webpack.NoEmitOnErrorsPlugin());
		}
	}
	return plugins;
};


module.exports = optimization;

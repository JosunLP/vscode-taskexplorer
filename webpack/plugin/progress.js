/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.progress
 */

const webpack = require("webpack");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {webpack.ProgressPlugin | undefined}
 */
const progress = (env, wpConfig) =>
{
	const plugin = new webpack.ProgressPlugin();
	return plugin;
};


module.exports = progress;

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.progress
 */

const webpack = require("webpack");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {webpack.ProgressPlugin | undefined}
 */
const progress = (env, wpConfig) =>
{
	if (env.app.plugins.progress !== false)
	{
		return new webpack.ProgressPlugin();
	}
};


module.exports = progress;

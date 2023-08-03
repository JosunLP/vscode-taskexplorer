/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.progress
 */

const webpack = require("webpack");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @returns {webpack.ProgressPlugin | undefined}
 */
const progress = (env) =>
{
	if (env.app.plugins.progress !== false)
	{
		return new webpack.ProgressPlugin();
	}
};


module.exports = progress;

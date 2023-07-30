/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module webpack.exports.experiments
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function entry
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const experiments = (env, wpConfig) =>
{
	if (env.build === "extension" || env.build === "browser")
	{
		wpConfig.experiments = { layers: true };
	}
};


module.exports = experiments;

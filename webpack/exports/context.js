// @ts-check

/**
 * @module wpbuild.exports.context
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @method
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const context = (env, wpConfig) =>
{
	wpConfig.context = env.paths.base;
};


module.exports = context;

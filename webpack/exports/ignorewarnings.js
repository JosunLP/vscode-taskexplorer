// @ts-check

/**
 * @module webpack.exports.stats
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

/**
 * @method ignorewarnings
 * https://webpack.js.org/configuration/other-options/#ignorewarnings
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const ignorewarnings = (env, wpConfig) =>
{
   if (!env.verbosity)
   {
		wpConfig.ignoreWarnings = [
			/Critical dependency\: the request of a dependency is an expression/,
			/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
			// {
			// 	module: /module2\.js\?[34]/, // A RegExp
			// }
		];
	}
};


module.exports = ignorewarnings;

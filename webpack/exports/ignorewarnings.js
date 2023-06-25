// @ts-check

/**
 * @module webpack.exports.stats
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */

/**
 * @method ignorewarnings
 * https://webpack.js.org/configuration/other-options/#ignorewarnings
 * @param {WebpackEnvironment} env Webpack build environment
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

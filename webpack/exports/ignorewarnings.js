// @ts-check

/**
 * @module wpbuild.exports.stats
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

/**
 * @function ignorewarnings
 * https://webpack.js.org/configuration/other-options/#ignorewarnings
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const ignorewarnings = (env) =>
{
   if (!env.verbosity || env.verbosity !== "none")
   {
		env.wpc.ignoreWarnings = [
			/Critical dependency\: the request of a dependency is an expression/,
			/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
			// {
			// 	module: /module2\.js\?[34]/, // A RegExp
			// }
		];
	}
};


module.exports = ignorewarnings;

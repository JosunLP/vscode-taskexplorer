// @ts-check

/**
 * @file exports/ignorewarnings.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */

/**
 * @function ignorewarnings
 * https://webpack.js.org/configuration/other-options/#ignorewarnings
 * @param {WpBuildApp} app Webpack build environment
 */
const ignorewarnings = (app) =>
{
   if (!app.verbosity || app.verbosity !== "none")
   {
		app.wpc.ignoreWarnings = [
			/Critical dependency\: the request of a dependency is an expression/,
			/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
			// {
			// 	module: /module2\.js\?[34]/, // A RegExp
			// }
		];
	}
};


module.exports = ignorewarnings;

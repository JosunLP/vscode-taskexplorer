// @ts-check

/**
 * @module webpack.exports.target
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function target
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const target = (env, wpConfig) =>
{
	if (env.build === "webview") {
		wpConfig.target = "webworker";
	}
	else if (env.build === "browser") {
		wpConfig.target = "web";
	}
	else {
		wpConfig.target = "node";
	}
	env.target = /** @type {WebpackTarget} */(wpConfig.target);
};


module.exports = target;

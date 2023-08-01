// @ts-check

/**
 * @module wpbuild.exports.target
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
	if (env.build === "webview")
	{
		wpConfig.target = env.target = "webworker";
	}
	else if (env.build === "browser")
	{
		wpConfig.target = env.target = "web";
	}
	else {
		wpConfig.target = env.target = "node";
	}
};


module.exports = target;

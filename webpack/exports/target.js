// @ts-check

/**
 * @module webpack.exports.target
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


/**
 * @method target
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const target = (env, wpConfig) =>
{
	if (env.build === "webview"|| env.build === "browser") {
		wpConfig.target = "webworker";
	}
	else {
		wpConfig.target = "node";
	}
};


module.exports = target;
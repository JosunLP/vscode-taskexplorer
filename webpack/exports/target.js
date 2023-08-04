// @ts-check

/**
 * @module wpbuild.exports.target
 */

/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function target
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const target = (env) =>
{
	if (env.build === "webview")
	{
		env.wpc.target = env.target = "webworker";
	}
	else if (env.build === "web")
	{
		env.wpc.target = env.target = "web";
	}
	else {
		env.wpc.target = env.target = "node";
	}
};


module.exports = target;

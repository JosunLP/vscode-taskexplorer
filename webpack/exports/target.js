// @ts-check

/**
 * @file exports/target.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */


/**
 * @function target
 * @param {WpBuildApp} app Webpack build environment
 */
const target = (app) =>
{
	if (app.build === "webview")
	{
		app.wpc.target = app.target = "webworker";
	}
	else if (app.build === "web")
	{
		app.wpc.target = app.target = "web";
	}
	else {
		app.wpc.target = app.target = "node";
	}
};


module.exports = target;

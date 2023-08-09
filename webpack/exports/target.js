// @ts-check

/**
 * @module wpbuild.exports.target
 */

/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildApp} WpBuildApp */


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

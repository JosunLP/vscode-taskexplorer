// @ts-check

/**
 * @file exports/mode.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const mode = (app) =>
{
	app.wpc.mode = app.mode = getMode(app.arge, app.argv);
	if (app.mode === "none") {
		app.mode = "test";
	}
};


/**
 * @function
 * @param {WpBuildRuntimeEnvArgs} env Webpack build environment
 * @param {WebpackRuntimeArgs} argv Webpack command line args
 * @returns {WebpackMode}
 */
const getMode = (env, argv) =>
{
	let mode = argv.mode;
	if (!mode)
	{
		if (env.mode === "development") {
			mode = "development";
		}
		else if (env.mode === "test" || env.type === "tests") {
			mode = "none";
		}
		else {
			mode = "production";
		}
	}
	return mode;
};


module.exports = { mode, getMode };

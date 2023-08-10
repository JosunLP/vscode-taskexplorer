// @ts-check

/**
 * @file exports/mode.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const mode = (app) =>
{
	app.wpc.mode = getMode(app.arge, app.argv);
	if (!app.environment)
	{
		if (app.wpc.mode === "development") {
			app.environment = "dev";
		}
		else if (app.wpc.mode === "none") {
			app.environment = "test";
		}
		else {
			app.environment = "prod";
		}
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
		if (env.environment === "dev") {
			mode = "development";
		}
		else if (env.environment === "test" || env.build === "tests") {
			mode = "none";
		}
		else {
			mode = "production";
		}
	}
	return mode;
};


module.exports = { mode, getMode };

// @ts-check

/**
 * @file exports/mode.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const typedefs = require("../types/typedefs");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */


/**
 * @function
 * @param {typedefs.WpBuildApp} app Webpack build environment
 */
const mode = (app) =>
{
	app.wpc.mode = getMode(app.arge, app.argv);
	if (app.mode === "none") {
		app.mode = "test";
	}
};


/**
 * @function
 * @template {boolean | undefined} [T=false]
 * @template {typedefs.WebpackMode | typedefs.WpBuildWebpackMode} [R=T extends false | undefined ? typedefs.WebpackMode : typedefs.WpBuildWebpackMode]
 * @param {WpBuildRuntimeEnvArgs} arge Webpack build environment
 * @param {WebpackRuntimeArgs} argv Webpack command line args
 * @param {T} [wpBuild] Convert to WpBuildWebpackMode @see {@link typedefs.WpBuildWebpackMode WpBuildWebpackMode}
 * @returns {R}
 */
const getMode = (arge, argv, wpBuild) =>
{
	/** @type typedefs.WebpackMode | typedefs.WpBuildWebpackMode | undefined */
	let mode = argv.mode;
	if (!mode)
	{
		if (arge.mode === "development" || argv.mode === "development") {
			mode = "development";
		}
		else if (arge.mode === "none" || argv.mode === "none" || arge.mode === "test" || arge.type === "tests") {
			mode = "none";
		}
		else {
			mode = "production";
		}
	}
	if (wpBuild === true && mode === "none") {
		mode = "test";
	}
	return /** @type {R} */(mode);
};


module.exports = { mode, getMode };

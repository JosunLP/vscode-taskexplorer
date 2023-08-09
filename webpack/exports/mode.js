// @ts-check

/**
 * @module wpbuild.exports.mode
 */

/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const mode = (app) =>
{
	app.wpc.mode = getMode(app, app.argv);
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
 * @param {Partial<WpBuildApp>} app Webpack build environment
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @returns {WebpackMode}
 */
const getMode = (app, argv) =>
{
	let mode = argv.mode;
	if (!mode)
	{
		if (app.environment === "dev") {
			mode = "development";
		}
		else if (app.environment === "test" || app.build === "tests") {
			mode = "none";
		}
		else {
			mode = "production";
		}
	}
	return mode;
};


module.exports = { mode, getMode };

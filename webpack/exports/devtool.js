// @ts-check

/**
 * @file exports/devtool.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../types").WpBuildApp} WpBuildApp */

/**
 * Adds library mode webpack config `output` object.
 *
 * Possible devTool values:
 *
 *     none:                        : Recommended for prod builds w/ max performance
 *     inline-source-map:           : Possible when publishing a single file
 *     cheap-source-map
 *     cheap-module-source-map
 *     eval:                        : Recommended for dev builds w/ max performance
 *     eval-source-map:             : Recommended for dev builds w/ high quality SourceMaps
 *     eval-cheap-module-source-map : Tradeoff for dev builds
 *     eval-cheap-source-map:       : Tradeoff for dev builds
 *     inline-cheap-source-map
 *     inline-cheap-module-source-map
 *     source-map:                  : Recommended for prod builds w/ high quality SourceMaps
 *
 * @function
 * @private
 * @param {WpBuildApp} app Webpack build environment
 */
const devtool = (app) =>
{   //
	// Disabled for this build - Using source-map-plugin - see webpack.plugin.js#sourcemaps
	// ann the plugins() function below
	//
	if (app.rc.plugins.sourcemaps)
	{
		app.wpc.devtool = false;
	}
	else
	{
		if (app.environment === "prod") {
			app.wpc.devtool = "source-map";
		}
		else if (app.environment === "dev") {
			app.wpc.devtool = "eval-source-map";
		}
		else if (app.isTests) {
			app.wpc.devtool = "eval";
		}
	}
};


module.exports = devtool;

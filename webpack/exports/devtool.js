// @ts-check

/**
 * @module wpbuild.exports.devtool
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

/**
 * Adds library mode webpack config `output` object.
 *
 * Possible devTool values:
 *
 *     none:                        : Recommended for prod builds w/ max performance
 *     inline-source-map:           : Possible when publishing a single file
 *     cheap-source-map
 *     cheap-module-source-map
 *     eval:                        : Recommended for de builds w/ max performance
 *     eval-source-map:             : Recommended for dev builds w/ high quality SourceMaps
 *     eval-cheap-module-source-map : Tradeoff for dev builds
 *     eval-cheap-source-map:       : Tradeoff for dev builds
 *     inline-cheap-source-map
 *     inline-cheap-module-source-map
 *     source-map:                  : Recommended for prod builds w/ high quality SourceMaps
 *
 * @function
 * @private
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const devtool = (env) =>
{   //
	// Disabled for this build - Using source-map-plugin - see webpack.plugin.js#sourcemaps
	// ann the plugins() function below
	//
	env.wpc.devtool = false;
};


module.exports = devtool;

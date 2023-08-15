/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { join } = require("path");

/** @typedef {import("../types/typedefs").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const resolve = (app) =>
{
	if (app.build.type !== "webapp")
	{
		app.wpc.resolve =
		{
			alias: {
				":env": join(app.getSrcPath(), "lib", "env", app.target),
				":types": join(app.getBuildPath(), "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			mainFields: app.build.target  === "web" || app.build.type === "webmodule" ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.build.target === "web" || app.build.type === "webmodule" ?
					  {
					  	  path: require.resolve("path-browserify"),
					  	  os: require.resolve("os-browserify/browser")
					  } :
					  undefined
		};
	}
	else
	{
		app.wpc.resolve = {
			alias: {
				":env": join(app.getSrcPath(), "lib", "env", "web"),
				":types": join(app.getBuildPath(), "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			modules: [ app.getContextPath(), "node_modules" ],
		};
	}
};


module.exports = resolve;

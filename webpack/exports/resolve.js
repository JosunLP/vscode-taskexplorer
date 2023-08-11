/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */

const path = require("path");


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const resolve = (app) =>
{
	if (app.build !== "webapp")
	{
		app.wpc.resolve =
		{
			alias: {
				":env": path.resolve(app.paths.build, "src", "lib", "env", app.target),
				":types": path.resolve(app.paths.build, "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			mainFields: app.build === "web" ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.build === "web" ?
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
				":env": path.resolve(app.paths.build, "src", "lib", "env", "web"),
				":types": path.resolve(app.paths.build, "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			modules: [ app.paths.base, "node_modules" ],
		};
	}
};


module.exports = resolve;

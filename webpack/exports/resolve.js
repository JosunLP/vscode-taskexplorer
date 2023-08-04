/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module wpbuild.exports.resolve
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

const path = require("path");


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const resolve = (env) =>
{
	if (env.build !== "webview")
	{
		env.wpc.resolve =
		{
			alias: {
				":env": path.resolve(env.paths.build, "src", "lib", "env", env.target),
				":types": path.resolve(env.paths.build, "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			mainFields: env.build === "web" ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: env.build === "web" ?
					  {
					  	  path: require.resolve("path-browserify"),
					  	  os: require.resolve("os-browserify/browser")
					  } :
					  undefined
		};
	}
	else
	{
		env.wpc.resolve = {
			alias: {
				":env": path.resolve(env.paths.build, "src", "lib", "env", "web"),
				":types": path.resolve(env.paths.build, "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			modules: [ env.paths.base, "node_modules" ],
		};
	}
};


module.exports = resolve;

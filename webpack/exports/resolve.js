/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module wpbuild.exports.resolve
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

const path = require("path");


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const resolve = (env, wpConfig) =>
{
	if (env.build !== "webview")
	{
		wpConfig.resolve =
		{
			alias: {
				":env": path.resolve(env.paths.build, "src", "lib", "env", env.target),
				":types": path.resolve(env.paths.build, "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			mainFields: env.build === "browser" ? [ "browser", "module", "main" ] : [ "module", "main" ],
			fallback: env.build === "browser" ?
					  {
					  	  path: require.resolve("path-browserify"),
					  	  os: require.resolve("os-browserify/browser")
					  } :
					  undefined
		};
	}
	else
	{
		wpConfig.resolve = {
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

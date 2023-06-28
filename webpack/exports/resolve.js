/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module webpack.exports.resolve
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */

const path = require("path");


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const resolve = (env, wpConfig) =>
{
	if (env.build !== "webview")
	{
		wpConfig.resolve =
		{
			alias: {
				":env": path.resolve(env.buildPath, "src", "lib", "env", env.build === "browser" ? "browser" : "node"),
				":types": path.resolve(env.buildPath, "types")
			},
			fallback: env.build === "browser" ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined,
			mainFields: env.build === "browser" ? [ "browser", "module", "main" ] : [ "module", "main" ],
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
		};
	}
	else
	{
		wpConfig.resolve = {
			alias: {
				":env": path.resolve(env.buildPath, "src", "lib", "env", "browser"),
				":types": path.resolve(env.buildPath, "types")
			},
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
			modules: [ env.basePath, "node_modules" ],
		};
	}
};


module.exports = resolve;

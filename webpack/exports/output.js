// @ts-check

const { apply } = require("../utils");
const { join, resolve } = require("path");

/**
 * @module webpack.exports.output
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const output = (env, wpConfig) =>
{
	if (env.build === "webview")
	{
		wpConfig.output = {
			clean: env.clean === true ? { keep: /(img|font|readme|walkthrough)[\\/]/ } : undefined,
			path: join(env.paths.build, "res"),
			publicPath: "#{webroot}/",
			filename: (pathData, _assetInfo) =>
			{
				let name = "[name]";
				if (pathData.chunk?.name) {
					name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
				}
				return `js/${name}.js`;
			}
		};
	}
	else if (env.build === "tests")
	{
		wpConfig.output = {
			// asyncChunks: true,
			clean: env.clean === true ?  { keep: /(test)[\\/]/ } : undefined,
			// libraryExport: "run",
			// globalObject: "this",
			// libraryTarget: 'commonjs2',
			path: join(env.paths.dist, "test"),
			filename: "[name].js",
			// module: true,
			// chunkFormat: "commonjs",
			// scriptType: "text/javascript",
			// library: {
			// 	type: "commonjs2"
			// },
			libraryTarget: "commonjs2"
		};
	}
	else
	{
		let outPath;
		const rtRelPath = env.build === "browser" ? "browser" : ".";
		if (env.buildMode === "release") {
			outPath = resolve(env.paths.dist, rtRelPath);
		}
		else {
			outPath = resolve(env.paths.temp, rtRelPath);
		}
		wpConfig.output =
		{
			clean: env.clean === true ? (env.isTests ? { keep: /(test)[\\/]/ } : true) : undefined,
			path: outPath,
			// filename: env.buildMode === "release" ? "[name].js" : "[name].debug.js",
			filename: env.buildMode === "release" ? "[name].[contenthash].js" : "[name].debug.[contenthash].js",
			libraryTarget: "commonjs2"
		};
	}

	apply(wpConfig.output,
	{
		compareBeforeEmit: true,
		hashDigestLength: 20
	});
};


module.exports = output;

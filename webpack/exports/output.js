// @ts-check

const path = require("path");

/**
 * @module webpack.exports.output
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


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
			path: path.join(env.buildPath, "res"),
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
			clean: env.clean === true,
			// libraryExport: "run",
			// globalObject: "this",
			// libraryTarget: 'commonjs2',
			path: path.join(env.buildPath, "dist", "test"),
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
		const isTests = !env.prodDbgBuild && env.environment.startsWith("test");
		let outPath = env.build === "browser" ? path.join(env.buildPath, "dist", "browser") : path.join(env.buildPath, "dist");
		if (env.prodDbgBuild) {
			outPath = path.resolve(env.buildPath, "..", "spm-license-server", "res", "app", "vscode-taskexplorer");
		}
		wpConfig.output = {
			clean: env.clean === true ? (isTests ? { keep: /(test)[\\/]/ } : true) : undefined,
			path: outPath,
			filename: !env.prodDbgBuild ? "[name].js" : "[name].debug.js",
			libraryTarget: "commonjs2"
		};
	}
};

module.exports = output;

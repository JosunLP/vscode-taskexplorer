// @ts-check

const { join, resolve } = require("path");
const { apply } = require("../utils/utils");

/**
 * @module wpbuild.exports.output
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const output = (env) =>
{
	env.wpc.output =
	{
		compareBeforeEmit: true,
		hashDigestLength: 20
	};

	if (env.build === "webview")
	{
		apply(env.wpc.output,
		{
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
		});
	}
	else if (env.build === "tests")
	{
		apply(env.wpc.output,
		{
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
		});
	}
	else if (env.build === "types")
	{
		apply(env.wpc.output,
		{
			clean: env.clean === true ?  { keep: /(test)[\\/]/ } : undefined,
			path: join(env.paths.build, "types", "dist"),
			filename: "[name].js",
			// libraryTarget: "umd",
    		// umdNamedDefine: true,
			libraryTarget: "commonjs2"
		});
	}
	else
	{
		apply(env.wpc.output,
		{
			clean: env.clean === true ? (env.isTests ? { keep: /(test)[\\/]/ } : true) : undefined,
			path: resolve(env.paths.dist, env.build === "web" ? "web" : "."),
			filename: "[name].[contenthash].js",
			libraryTarget: "commonjs2"
		});
	}
};


module.exports = output;

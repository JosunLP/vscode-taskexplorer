// @ts-check

const { join, resolve } = require("path");
const { apply } = require("../utils/utils");
const { RegexTestsChunk } = require("../utils");

/**
 * @file exports/output.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackPathData}  WebpackPathData */
/** @typedef {import("../types").WebpackAssetInfo}  WebpackAssetInfo */
/** @typedef {import("../types").RequireKeys<WebpackPathData, "filename" | "chunk">} WebpackPathDataOutput */

/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const output = (app) =>
{
	const path = resolve(app.getDistPath({ rel: false }), app.build.target === "web" || app.build.type === "webmodule" ? "web" : ".");

	app.wpc.output =
	{
		path,
		filename: "[name].js",
		compareBeforeEmit: true,
		hashDigestLength: 20,
		libraryTarget: "commonjs2",
		clean: app.clean ? (app.isTests ? { keep: /(test)[\\/]/ } : app.clean) : undefined,
	};

	if (app.build.type === "webapp")
	{
		apply(app.wpc.output,
		{
			clean: app.clean ? { keep: /(img|font|readme|walkthrough)[\\/]/ } : undefined,
			libraryTarget: undefined,
			publicPath: "#{webroot}/",
			/**
			 * @param {WebpackPathData} pathData
			 * @param {WebpackAssetInfo | undefined} _assetInfo
			 */
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
	else if (app.build.type === "tests")
	{
		apply(app.wpc.output,
		{
			libraryTarget: "umd",
			umdNamedDefine: true
		});
	}
	else if (app.build.type === "types")
	{
		apply(app.wpc.output,
		{
			path: join(app.getBuildPath({ rel: false }), "types", "dist")
		});
	}
	else
	{
		app.wpc.output.filename = (pathData, _assetInfo) =>
		{
			const data = /** @type {WebpackPathDataOutput} */(pathData);
			return RegexTestsChunk.test(data.chunk.name || "") ? "[name].js" : "[name].[contenthash].js";
		};
	}
};


module.exports = output;

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.copy
 */

const { existsSync } = require("fs");
const { asArray } = require("../utils");
const { join, posix } = require("path");
const CopyPlugin = require("copy-webpack-plugin");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {String[]} apps
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {CopyPlugin | undefined}
 */
const copy = (apps, env, wpConfig) =>
{
	const /** @type {CopyPlugin.Pattern[]} */patterns = [],
		  psxBuildPath = env.paths.build.replace(/\\/g, "/"),
		  psxBasePath = env.paths.base.replace(/\\/g, "/"),
		  psxDistPath = env.paths.dist.replace(/\\/g, "/"),
		  psxBaseCtxPath = posix.join(psxBasePath, "res");

	if (env.build === "webview")
	{
		apps.filter(app => existsSync(join(env.paths.base, app, "res"))).forEach(
			(app) => patterns.push(
			{
				from: posix.join(psxBasePath, app, "res", "*.*"),
				to: posix.join(psxBuildPath, "res", "webview"),
				context: posix.join(psxBasePath, app, "res")
			})
		);
		if (existsSync(join(env.paths.base, "res")))
		{
			patterns.push({
				from: posix.join(psxBasePath, "res", "*.*"),
				to: posix.join(psxBuildPath, "res", "webview"),
				context: psxBaseCtxPath
			});
		}
	}
	else if ((env.build === "extension" || env.build === "browser") && env.stripLogging)
	{
		asArray(env.app.mainChunk).forEach((chunk) =>
		{
			patterns.push(
			{
				from: posix.join(psxDistPath, `${chunk}.*.js`),
				to: posix.join(psxDistPath, `${chunk}.js`),
				context: psxDistPath,
				// transform: (content, absoluteFrom) => content
				// transform: {
				//     transformer: (content, absoluteFrom) => content
				// }
			});
		});

		if (wpConfig.mode === "production")
		{
			const psxDirInfoProj = posix.resolve(posix.join(psxBuildPath, "..", `${env.app.name}-info`));
			patterns.push(
			{
				from: posix.join(psxBasePath, "res", "img", "**"),
				to: posix.join(psxDirInfoProj, "res"),
				context: psxBaseCtxPath
			},
			{
				from: posix.join(psxBasePath, "res", "readme", "*.png"),
				to: posix.join(psxDirInfoProj, "res"),
				context: psxBaseCtxPath
			},
			{
				from: posix.join(psxBasePath, "doc", ".todo"),
				to: posix.join(psxDirInfoProj, "doc"),
				context: psxBaseCtxPath
			},
			{
				from: posix.join(psxBasePath, "res", "walkthrough", "welcome", "*.md"),
				to: posix.join(psxDirInfoProj, "doc"),
				context: psxBaseCtxPath
			},
			{
				from: posix.join(psxBasePath, "*.md"),
				to: posix.join(psxDirInfoProj),
				context: psxBaseCtxPath
			},
			{
				from: posix.join(psxBasePath, "LICENSE*"),
				to: posix.join(psxDirInfoProj),
				context: psxBaseCtxPath
			});
		}
	}
	if (patterns.length > 0) {
		return new CopyPlugin({ patterns });
	}
};


module.exports = copy;

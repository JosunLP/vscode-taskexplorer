/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.copy
 */

const fs = require("fs");
const path = require("path");
const { asArray } = require("../utils");
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
		  psxBaseCtxPath = path.posix.join(psxBasePath, "res");

	if (env.build === "webview")
	{
		apps.filter(app => fs.existsSync(path.join(env.paths.base, app, "res"))).forEach(
			(app) => patterns.push(
			{
				from: path.posix.join(psxBasePath, app, "res", "*.*"),
				to: path.posix.join(psxBuildPath, "res", "webview"),
				context: path.posix.join(psxBasePath, app, "res")
			})
		);
		if (fs.existsSync(path.join(env.paths.base, "res")))
		{
			patterns.push({
				from: path.posix.join(psxBasePath, "res", "*.*"),
				to: path.posix.join(psxBuildPath, "res", "webview"),
				context: psxBaseCtxPath
			});
		}
	}
	else if ((env.build === "extension" || env.build === "browser") && env.stripLogging)
	{
		asArray(env.app.mainChunk).forEach((chunk) =>
		{
			if (env.state.hash.next[chunk] !== env.state.hash.current[chunk] || !fs.existsSync(path.join(env.paths.dist, `${chunk}.js`)))
			{
				 const teModule = path.join(env.paths.dist, `${chunk}.${env.state.hash.next[chunk]}.js`);
				 if (fs.existsSync(teModule))
				 {
					patterns.push(
					{
						from: path.posix.join(psxDistPath, teModule),
						to: path.posix.join(psxDistPath, `${env.app.mainChunk}.js`),
						context: psxBasePath,
						// transform: (content, absoluteFrom) => content
						// transform: {
						//     transformer: (content, absoluteFrom) => content
						// }
					});
			  }
			}
		});

		if (wpConfig.mode === "production")
		{
			const psxDirInfoProj = path.posix.resolve(path.posix.join(psxBuildPath, "..", "vscode-taskexplorer-info"));
			patterns.push(
			{
				from: path.posix.join(psxBasePath, "res", "img", "**"),
				to: path.posix.join(psxDirInfoProj, "res"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "res", "readme", "*.png"),
				to: path.posix.join(psxDirInfoProj, "res"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "doc", ".todo"),
				to: path.posix.join(psxDirInfoProj, "doc"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "res", "walkthrough", "welcome", "*.md"),
				to: path.posix.join(psxDirInfoProj, "doc"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "*.md"),
				to: path.posix.join(psxDirInfoProj),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "LICENSE*"),
				to: path.posix.join(psxDirInfoProj),
				context: psxBaseCtxPath
			});
		}
	}
	if (patterns.length > 0) {
		return new CopyPlugin({ patterns });
	}
};


module.exports = copy;

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.copy
 */

const fs = require("fs");
const path = require("path");
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
	let plugin;
	const /** @type {CopyPlugin.Pattern[]} */patterns = [],
		psx__dirname = env.paths.build.replace(/\\/g, "/"),
		psxBasePath = env.paths.base.replace(/\\/g, "/"),
		psxBaseCtxPath = path.posix.join(psxBasePath, "res");
	if (env.build === "webview")
	{
		apps.filter(app => fs.existsSync(path.join(env.paths.base, app, "res"))).forEach(
			app => patterns.push(
			{
				from: path.posix.join(psxBasePath, app, "res", "*.*"),
				to: path.posix.join(psx__dirname, "res", "webview"),
				context: path.posix.join(psxBasePath, app, "res")
			})
		);
		if (fs.existsSync(path.join(env.paths.base, "res")))
		{
			patterns.push({
				from: path.posix.join(psxBasePath, "res", "*.*"),
				to: path.posix.join(psx__dirname, "res", "webview"),
				context: psxBaseCtxPath
			});
		}
	}
	else if ((env.build === "extension" || env.build === "browser") && wpConfig.mode === "production")
	{
		const psx__dirname_info = path.posix.normalize(path.posix.join(psx__dirname, "..", "vscode-taskexplorer-info"));
		patterns.push(
		{
			from: path.posix.join(psxBasePath, "res", "img", "**"),
			to: path.posix.join(psx__dirname_info, "res"),
			context: psxBaseCtxPath
		},
		{
			from: path.posix.join(psxBasePath, "res", "readme", "*.png"),
			to: path.posix.join(psx__dirname_info, "res"),
			context: psxBaseCtxPath
		},
		{
			from: path.posix.join(psxBasePath, "doc", ".todo"),
			to: path.posix.join(psx__dirname_info, "doc"),
			context: psxBaseCtxPath
		},
		{
			from: path.posix.join(psxBasePath, "res", "walkthrough", "welcome", "*.md"),
			to: path.posix.join(psx__dirname_info, "doc"),
			context: psxBaseCtxPath
		},
		{
			from: path.posix.join(psxBasePath, "*.md"),
			to: path.posix.join(psx__dirname_info),
			context: psxBaseCtxPath
		},
		{
			from: path.posix.join(psxBasePath, "LICENSE*"),
			to: path.posix.join(psx__dirname_info),
			context: psxBaseCtxPath
		});
	}
	if (patterns.length > 0) {
		plugin = new CopyPlugin({ patterns });
	}
	return plugin;
}


module.exports = copy;

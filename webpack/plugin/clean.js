/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.clean
 */

const path = require("path");
const { unlinkSync, existsSync, rmSync } = require("fs");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */


/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {CleanWebpackPlugin | undefined}
 */
const clean = (env, wpConfig) =>
{
    /** @type {CleanWebpackPlugin | undefined} */
	let plugin;
	if (env.clean === true)
	{
		if (env.build === "webview")
		{
			const basePath = path.posix.join(env.paths.build.replace(/\\/g, "/"), "res");
			plugin = new CleanWebpackPlugin(
			{
				dry: false,
				dangerouslyAllowCleanPatternsOutsideProject: true,
				cleanOnceBeforeBuildPatterns: [
					path.posix.join(basePath, "css", "**"),
					path.posix.join(basePath, "js", "**"),
					path.posix.join(basePath, "page", "**")
				]
			});
		}
		else if (env.build === "extension")
		{
			if (env.buildMode === "debug" && existsSync(env.paths.temp))
			{
				rmSync(env.paths.temp, { recursive: true, force: true});
			}
			// if (existsSync(env.paths.files.hash)) {
			// 	unlinkSync(env.paths.files.hash);
			// }
			// plugin = new CleanWebpackPlugin(
			// {
			// 	dry: false,
			// 	dangerouslyAllowCleanPatternsOutsideProject: true,
			// 	cleanOnceBeforeBuildPatterns: wpConfig.mode === "production" ? [
			// 		path.posix.join(env.paths.build.replace(/\\/g, "/"), "dist", "**"),
			// 		path.posix.join(env.paths.build.replace(/\\/g, "/"), ".coverage", "**"),
			// 		path.posix.join(env.paths.build.replace(/\\/g, "/"), ".nyc-output", "**"),
			// 		"!dist/webview/app/**"
			// 	] : [
			// 		path.posix.join(env.paths.build.replace(/\\/g, "/"), "dist", "**"),
			// 		"!dist/webview/app/**"
			// 	]
			// });
		}
	}
	return plugin;
};


module.exports = clean;

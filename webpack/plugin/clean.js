/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.clean
 */

const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {CleanWebpackPlugin | undefined}
 */
const clean = (env, wpConfig) =>
{
    /** @type {CleanWebpackPlugin | undefined} */
	let plugin;
	if (env.app.plugins.clean !== false && env.clean === true)
	{
		if (env.build === "webview")
		{
			const basePath = path.posix.join(env.paths.build.replace(/\\/g, "/"), "res");
			plugin = new CleanWebpackPlugin(
			{
				dry: false,
				cleanOnceBeforeBuildPatterns: [
					path.posix.join(basePath, "css", "**"),
					path.posix.join(basePath, "js", "**"),
					path.posix.join(basePath, "page", "**")
				]
			});
		}
		else if (env.isExtension)
		{
			plugin = new CleanWebpackPlugin(
			{
				dry: false,
				cleanStaleWebpackAssets: true,
				dangerouslyAllowCleanPatternsOutsideProject: true,
				cleanOnceBeforeBuildPatterns: [
					`${env.paths.temp}/**`
				]
			});
		}
	}
	return plugin;
};


module.exports = clean;

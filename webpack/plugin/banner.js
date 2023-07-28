/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.banner
 */

const webpack = require("webpack");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */


/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {webpack.BannerPlugin | undefined}
 */
const banner = (env, wpConfig) =>
{
    let plugin;
	if (wpConfig.mode === "production")
	{
		const chunks = Object.keys(wpConfig.entry).reduce((e, c) => `${!!c ? `${c}|` : c}${e}`, "");
		plugin = new webpack.BannerPlugin(
		{
			banner: `Copyright ${(new Date()).getFullYear()} ${env.app.pkgJson.name || env.app.pkgJson.author?.name || "Scott P Meesseman"}`,
			entryOnly: true,
			test: new RegExp(`(?:${chunks})(?:\\.debug)?\\.js`)
			// raw: true
		});
	}
	return plugin;
};


module.exports = banner;

/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.banner
 */

const webpack = require("webpack");
const { getEntriesRegex, isString } = require("../utils/utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {webpack.BannerPlugin | undefined}
 */
const banner = (env, wpConfig) =>
{
    let plugin;
	if (env.app.plugins.banner !== false && wpConfig.mode === "production")
	{
		const entriesRgx = getEntriesRegex(wpConfig, true, true),
			  author = isString(env.app.pkgJson.author) ? env.app.pkgJson.author :
			  		   /** @type {{ name: string; email?: string | undefined; }} */(env.app.pkgJson.author)?.name;
		if (author)
		{
			plugin = new webpack.BannerPlugin(
			{
				banner: `Copyright ${(new Date()).getFullYear()} ${author}`,
				entryOnly: true,
				test: entriesRgx
				// raw: true
			});
		}
	}
	return plugin;
};


module.exports = banner;

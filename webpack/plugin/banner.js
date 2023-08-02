/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.banner
 */

const webpack = require("webpack");
const WpBuildBasePlugin = require("./base");
const { getEntriesRegex, isString } = require("../utils/utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WpBuildBasePlugin | undefined}
 */
const banner = (env, wpConfig) =>
{
	if (env.app.plugins.banner !== false && wpConfig.mode === "production")
	{
		const author = isString(env.app.pkgJson.author) ? env.app.pkgJson.author : env.app.pkgJson.author?.name;
		if (author)
		{
			return new WpBuildBasePlugin({
				env, wpConfig,
				plugins: [
				{
					ctor: webpack.BannerPlugin,
					options: {
						banner: `Copyright ${(new Date()).getFullYear()} ${author}`,
						entryOnly: true,
						test: getEntriesRegex(wpConfig, true, true)
					}
				}]
			});
		}
	}
};


module.exports = banner;

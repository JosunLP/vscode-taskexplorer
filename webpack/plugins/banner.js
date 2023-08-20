/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/banner.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const webpack = require("webpack");
const WpBuildPlugin = require("./base");
const { isString } = require("../utils/utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildPlugin | undefined}
 */
const banner = (app) =>
{
	if (app.build.plugins.banner !== false && app.build.type !== "tests" && app.wpc.mode === "production")
	{
		const author = isString(app.pkgJson.author) ? app.pkgJson.author : app.pkgJson.author?.name;
		if (author)
		{
			return new WpBuildPlugin({
				app,
				plugins: [
				{
					ctor: webpack.BannerPlugin,
					options: {
						banner: `Copyright ${(new Date()).getFullYear()} ${author}`,
						entryOnly: true,
						test: WpBuildPlugin.getEntriesRegex(app.wpc, true, true)
					}
				}]
			});
		}
	}
};


module.exports = banner;

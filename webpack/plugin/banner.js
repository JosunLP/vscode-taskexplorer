/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/banner.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const webpack = require("webpack");
const WpBuildBasePlugin = require("./base");
const { isString } = require("../utils/utils");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildBasePlugin | undefined}
 */
const banner = (env) =>
{
	if (env.app.plugins.banner !== false && env.build !== "tests" && env.wpc.mode === "production")
	{
		const author = isString(env.app.pkgJson.author) ? env.app.pkgJson.author : env.app.pkgJson.author?.name;
		if (author)
		{
			return new WpBuildBasePlugin({
				env,
				plugins: [
				{
					ctor: webpack.BannerPlugin,
					options: {
						banner: `Copyright ${(new Date()).getFullYear()} ${author}`,
						entryOnly: true,
						test: WpBuildBasePlugin.getEntriesRegex(env.wpc, true, true)
					}
				}]
			});
		}
	}
};


module.exports = banner;

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.banner
 */

const webpack = require("webpack");
const WpBuildBasePlugin = require("./base");
const { isString, apply } = require("../utils/utils");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */


class WpBuildBannerPlugin extends WpBuildBasePlugin
{
	/**
	 * @class WpBuildCopyPlugin
	 * @param {WpBuildPluginOptions} options Plugin options to be applied
	 */
	constructor(options)
    {
        super(apply(options, { plugins: WpBuildBannerPlugin.vendorPlugins(options.env) }));
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler, {});
    }


	/**
	 * @function
	 * @private
	 * @static
	 * @param {WpBuildEnvironment} env
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static vendorPlugins = (env) =>
	{
		const plugins = [],
			  author = isString(env.app.pkgJson.author) ? env.app.pkgJson.author : env.app.pkgJson.author?.name;
		if (author)
		{
			plugins.push({
				ctor: webpack.BannerPlugin,
				options: {
					banner: `Copyright ${(new Date()).getFullYear()} ${author}`,
					entryOnly: true,
					test: WpBuildBasePlugin.getEntriesRegex(env.wpc, true, true)
				}
			});
		}
		return plugins;
	};
}


/**
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildBasePlugin | WebpackPluginInstance | undefined}
 */
const banner = (env) =>
	env.app.plugins.banner !== false && env.wpc.mode === "production" ? new WpBuildBannerPlugin({ env }).getPlugins()[1] : undefined;


module.exports = banner;

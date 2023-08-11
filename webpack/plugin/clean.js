/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/clean.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const path = require("path");
const WpBuildPlugin = require("./base");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { readdirSync, unlinkSync, existsSync } = require("fs");
const { join } = require("path");
const { apply } = require("../utils");

/** @typedef {import("../types").WebpackStats} WebpackStats */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */


class WpBuildCleanPlugin extends WpBuildPlugin
{
    /**
     * @class WpBuildLicenseFilePlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(
			apply(options, options.app.clean !== true ? {} :
			{
				plugins: WpBuildCleanPlugin.vendorPlugins(options.app),
			})
		);
    }

    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		this.onApply(compiler,
		{
			cleanStaleAssets: {
				hook: "done",
				callback: this.staleAssets.bind(this)
			}
		});
	}


    /**
     * @function
     * @param {WebpackStats} stats the compiler instance
     * @returns {void}
     */
	staleAssets(stats)
	{
		if (existsSync(this.app.rc.paths.dist))
		{
			readdirSync(this.app.rc.paths.dist).filter(p => this.fileNameHashRegex().test(p)).forEach((file) =>
			{
				const assets = stats.compilation.getAssets(),
					  clean = !assets.find(a => a.name === file);
				if (clean) {
					unlinkSync(join(this.app.rc.paths.dist, file));
				}
			});
		}
	}


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static vendorPlugins = (app) =>
	{
		return [{
			ctor: CleanWebpackPlugin,
			options: app.build === "webapp" ? {
				dry: false,
				cleanOnceBeforeBuildPatterns: [
					path.posix.join(app.paths.base, "css", "**"),
					path.posix.join(app.paths.base, "js", "**"),
					path.posix.join(app.paths.base, "page", "**")
				]
			} : {
				dry: false,
				cleanStaleWebpackAssets: true,
				dangerouslyAllowCleanPatternsOutsideProject: true,
				cleanOnceBeforeBuildPatterns: [
					`${app.paths.temp}/**`
				]
			}
		}];
	};

}


/**
 * @param {WpBuildApp} app
 * @returns {(WpBuildCleanPlugin | CleanWebpackPlugin)[]}
 */
const clean = (app) => app.rc.plugins.clean && app.build !== "tests" ? new WpBuildCleanPlugin({ app }).getPlugins() : [];


module.exports = clean;

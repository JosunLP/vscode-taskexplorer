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
const WpBuildBasePlugin = require("./base");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { readdirSync, unlinkSync, existsSync } = require("fs");
const { join } = require("path");
const { apply } = require("../utils");

/** @typedef {import("../types").WebpackStats} WebpackStats */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */


class WpBuildCleanPlugin extends WpBuildBasePlugin
{
    /**
     * @class WpBuildLicenseFilePlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(
			apply(options, options.env.clean !== true ? {} :
			{
				plugins: WpBuildCleanPlugin.vendorPlugins(options.env),
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
		if (existsSync(this.env.paths.dist))
		{
			readdirSync(this.env.paths.dist).filter(p => this.fileNameHashRegex().test(p)).forEach((file) =>
			{
				const assets = stats.compilation.getAssets(),
					  clean = !assets.find(a => a.name === file);
				if (clean) {
					unlinkSync(join(this.env.paths.dist, file));
				}
			});
		}
	}


	/**
	 * @function
	 * @private
	 * @param {WpBuildEnvironment} env
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static vendorPlugins = (env) =>
	{
		return [{
			ctor: CleanWebpackPlugin,
			options: env.build === "webview" ? {
				dry: false,
				cleanOnceBeforeBuildPatterns: [
					path.posix.join(env.paths.basePath, "css", "**"),
					path.posix.join(env.paths.basePath, "js", "**"),
					path.posix.join(env.paths.basePath, "page", "**")
				]
			} : {
				dry: false,
				cleanStaleWebpackAssets: true,
				dangerouslyAllowCleanPatternsOutsideProject: true,
				cleanOnceBeforeBuildPatterns: [
					`${env.paths.temp}/**`
				]
			}
		}];
	};

}


/**
 * @param {WpBuildEnvironment} env
 * @returns {(WpBuildCleanPlugin | CleanWebpackPlugin)[]}
 */
const clean = (env) => env.app.plugins.clean && env.build !== "tests" ? new WpBuildCleanPlugin({ env }).getPlugins() : [];


module.exports = clean;

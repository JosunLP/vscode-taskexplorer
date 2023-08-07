/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file vendormod.js
 * @author Scott Meesseman
 */

const { basename, join } = require("path");
const WpBuildBasePlugin = require("./base");
const { existsSync, readFileSync, readdirSync, writeFileSync } = require("fs");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


class WpBuildVendorModPlugin extends WpBuildBasePlugin
{

    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		this.onApply(compiler,
        {
            modifyVendorPlugins: {
                hook: "afterEnvironment",
                callback: this.modifyVendorPlugins.bind(this)
            }
        });
    }


	/**
	 * @function
	 * @private
	 */
	modifyVendorPlugins = () =>
	{   //
		// Make a lil change to the copy-plugin to initialize the current assets array to
		// the existing contents of the dist directory.  By default it's current assets list
		// is empty, and thus will not work across IDE restarts
		//
		const copyPlugin = join(this.env.paths.build, "node_modules", "clean-webpack-plugin", "dist", "clean-webpack-plugin.js");
		if (existsSync(copyPlugin))
		{
			let content = readFileSync(copyPlugin, "utf8").replace(/currentAssets = \[ "[\w"\., _\-]+" \]/, "currentAssets = []");
			if (existsSync(this.env.paths.dist))
			{
				const distFiles = `"${readdirSync(this.env.paths.dist).map(f => basename(f)).join("\", \"")}"`;
				content = content.replace("currentAssets = []", `currentAssets = [ ${distFiles} ]`);
			}
			writeFileSync(copyPlugin, content);
		}
	};

}


/**
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildVendorModPlugin | undefined}
 */
const vendormod = (env) =>
	env.app.plugins.vendormod !== false && env.build !== "webview" ? new WpBuildVendorModPlugin({ env }) : undefined;


module.exports = vendormod;

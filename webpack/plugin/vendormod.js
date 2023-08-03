/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.vendormod
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
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		this.onApply(compiler,
        {
            pluginClean: {
                hook: "afterEnvironment",
                callback: this.pluginClean.bind(this)
            }
        });
    }


	/**
	 * @param {WpBuildEnvironment} env
	 */
	pluginClean = (env) =>
	{   //
		// Make a lil change to the copy-plugin to initialize the current assets array to
		// the existing contents of the dist directory.  By default it's current assets list
		// is empty, and thus will not work across IDE restarts
		//
		const copyPlugin = join(env.paths.build, "node_modules", "clean-webpack-plugin", "dist", "clean-webpack-plugin.js");
		if (existsSync(copyPlugin))
		{
			let content = readFileSync(copyPlugin, "utf8").replace(/currentAssets = \[ "[\w"\., _\-]+" \]/, "currentAssets = []");
			if (existsSync(env.paths.dist))
			{
				const distFiles = `"${readdirSync(env.paths.dist).map(f => basename(f)).join("\", \"")}"`;
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

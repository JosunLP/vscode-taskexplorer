/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/vendormod.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * When adding a new plugin, perform the following tasks:
 *
 *     1. Add the plugin filename (w/o extnsion) to the `WpBuildPluginName` type near the
 *        top of the WpBuild types file
 *        file:///c:\Projects\vscode-taskexplorer\webpack\types\wpbuild.d.ts
 *
 *     2. Adjust the default application object's plugins hash by adding the plugin filename
 *        (w/o/ extension) as a key of the `plugins()` return object
 *        file:///:\Projects\vscode-taskexplorer\webpack\utils\environment.js
 *
 *     3. Adjust the rc configuration files by adding the plugin filename (w/o/ extension)
 *        as a key of the `plugins` object
 *        file:///c:\Projects\vscode-taskexplorer\webpack\.wpbuildrc.json
 *        file:///c:\Projects\vscode-taskexplorer\webpack\types\.wpbuildrc.defaults.json
 *
 *     4. Add a module reference to plugin directory index file and add to it's module.exports
 *        file://c:\Projects\vscode-taskexplorer\webpack\plugin\index.js
 *
 *     5.  Add the module into the modulke in the webpack exports byt importing and placing it
 *         in an appropriate position in the configuraation plugin array.
 *         file:///c:\Projects\vscode-taskexplorer\webpack\exports\plugins.js
 */

const { basename, join } = require("path");
const WpBuildPlugin = require("./base");
const { existsSync, readFileSync, readdirSync, writeFileSync } = require("fs");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


class WpBuildVendorModPlugin extends WpBuildPlugin
{

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
		const copyPlugin = join(this.app.paths.build, "node_modules", "clean-webpack-plugin", "dist", "clean-webpack-plugin.js");
		if (existsSync(copyPlugin))
		{
			let content = readFileSync(copyPlugin, "utf8").replace(/currentAssets = \[ "[\w"\., _\-]+" \]/, "currentAssets = []");
			if (existsSync(this.app.rc.paths.dist))
			{
				const distFiles = `"${readdirSync(this.app.rc.paths.dist).map(f => basename(f)).join("\", \"")}"`;
				content = content.replace("currentAssets = []", `currentAssets = [ ${distFiles} ]`);
			}
			writeFileSync(copyPlugin, content);
		}
	};

}


/**
 * Returns a `WpBuildVendorModPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpconfigrc.json by setting the `plugins.vendormod`
 * property to a boolean value of  `true` or `false`
 * @function
 * @module
 * @param {WpBuildApp} app
 * @returns {WpBuildVendorModPlugin | undefined}
 */
const vendormod = (app) => app.rc.plugins.vendormod && app.build !== "webapp" ? new WpBuildVendorModPlugin({ app }) : undefined;


module.exports = vendormod;

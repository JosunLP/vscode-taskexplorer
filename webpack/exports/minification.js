/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { merge } = require("../utils/utils");
const TerserPlugin = require("terser-webpack-plugin");

/**
 * @file exports/minification.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const minification = (app) =>
{   //
	// NOTE:  Webpack 5 performs minification built-in now for production builds.
	// Most likely, set app.exports.minification=false
	//
	if (app.rc.exports.minification && app.wpc.mode === "production")
	{
		app.wpc.optimization = merge(app.wpc.optimization || {},
		{
			minimize: true,
			minimizer: [
				new TerserPlugin(
				app.esbuild ?
				{
					minify: TerserPlugin.esbuildMinify,
					terserOptions: {
						// @ts-ignore
						drop: [ "debugger" ],
						// compress: true,
						// mangle: true,   // Default `false`
						format: { ecma: 2020, comments: false },
						minify: true,
						sourceMap: false,
						treeShaking: true,
						// Keep the class names otherwise @log won"t provide a useful name
						keepNames: true,
						// keep_names: true,
						target: "es2020"
					}
				} :
				{
					extractComments: false,
					parallel: true,
					terserOptions: {
						compress: {
							drop_debugger: true
						},
						// compress: true,
						// mangle: true,   // Default `false`
						ecma: 2020,
						sourceMap: false,
						format: {},
						// format: {       // Default {}
						// 	comments: false, // default "some"
						// 	shebang: true
						// },
						// toplevel (default false) - set to true to enable top level variable
						// and function name mangling and to drop unused variables and functions.
						// toplevel: false,
						// nameCache: null,
						// Keep the class names otherwise @log won"t provide a useful name
						keep_classnames: true,
						module: true
					}
				})
			]
		});
	}
};


module.exports = minification;

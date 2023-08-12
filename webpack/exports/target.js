// @ts-check

/**
 * @file exports/target.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 * 
 * @description
 * 
 * https://webpack.js.org/configuration/target/
 * 
 * Targets:
 * 
 * async-node[[X].Y]	    Compile for usage in a Node.js-like environment (uses fs and vm to load chunks asynchronously)
 * electron[[X].Y]-main	    Compile for Electron for main process.
 * electron[[X].Y]-renderer	Compile for Electron for renderer process, providing a target using JsonpTemplatePlugin,
 *                          FunctionModulePlugin for browser environments and NodeTargetPlugin and ExternalsPlugin for
 *                          CommonJS and Electron built-in modules.
 * electron[[X].Y]-preload	Compile for Electron for renderer process, providing a target using NodeTemplatePlugin with
 *                          asyncChunkLoading set to true, FunctionModulePlugin for browser environments and NodeTargetPlugin
 *                          and ExternalsPlugin for CommonJS and Electron built-in modules.
 * node[[X].Y]	            Compile for usage in a Node.js-like environment (uses Node.js require to load chunks)
 * node-webkit[[X].Y]	    Compile for usage in WebKit and uses JSONP for chunk loading. Allows importing of built-i
 *                           Node.js modules and nw.gui (experimental)
 * nwjs[[X].Y]	            The same as node-webkit
 * web	Compile for usage in a browser-like environment (default)
 * webworker	            Compile as WebWorker
 * esX	                    Compile for specified ECMAScript version. Examples: es5, es2020.
 * browserslist             Infer a platform and the ES-features from a browserslist-config (default if browserslist config
 *                          is available)
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */


/**
 * @see {@link https://webpack.js.org/configuration/target/}
 * @function target
 * @param {WpBuildApp} app Webpack build environment
 */
const target = (app) =>
{
	if (app.build.target)
	{
		app.wpc.target = app.target = app.build.target;
	}
	else if (app.build.mode === "webworker" || app.build.type  === "webapp")
	{
		app.wpc.target = app.target = "webworker";
	}
	else if (app.build.mode === "web")
	{
		app.wpc.target = app.target = "web";
	}
	else {
		app.wpc.target = app.target = "node";
	}
};


module.exports = target;

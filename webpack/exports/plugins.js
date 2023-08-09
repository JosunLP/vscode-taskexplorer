/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const {
	analyze, banner, clean, copy, dispose, environment, istanbul, loghooks,
	ignore, optimization, progress, runtimevars, sourcemaps, licensefiles, tscheck, upload, wait,
	cssextract, htmlcsp, imageminimizer, htmlinlinechunks, testsuite, vendormod, webviewapps, scm
} = require("../plugin");

/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build specific environment
 */
const plugins = (env) =>
{
	env.wpc.plugins = [
		loghooks(env),           // n/a - logs all compiler.hooks.* when they run
		environment(env),        // compiler.hooks.environment
		vendormod(env),          // compiler.hooks.afterEnvironment - mods to vendor plugins and/or modules
		progress(env),           // n/a - reports progress from webpack engine
		wait(env),               // compiler.run
		...clean(env),           // compiler.hooks.emit, compiler.hooks.done
		testsuite(env),          // compiler.hooks.beforeCompile - build tests / test suite
		banner(env),             // compiler.hooks.compilation -> compilation.hooks.processAssets
		istanbul(env),           // compiler.hooks.compilation - add istanbul ignores to node-requires
		runtimevars(env),        // compiler.hooks.compilation
		ignore(env),             // compiler.hooks.normalModuleFactory
		...tscheck(env),         // compiler.hooks.afterEnvironment, hooks.afterCompile
		...webviewPlugins(env),  // webview specific plugins
		...sourcemaps(env),      // compiler.hooks.compilation -> compilation.hooks.processAssets
		...copy([], env),        // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
		...optimization(env),    // compiler.hooks.shouldEmit, compiler.hooks.compilation->shouldRecord|optimizeChunks
		analyze.bundle(env),     // compiler.hooks.done
		analyze.visualizer(env), // compiler.hooks.emit
		analyze.circular(env),   // compiler.hooks.compilation -> compilation.hooks.optimizeModules
		licensefiles(env),       // compiler.hooks.shutdown
		upload(env),             // compiler.hooks.afterDone
		scm(env),                // compiler.hooks.shutdown
		dispose(env)             // perform cleanup, dispose registred disposables
	];
	env.wpc.plugins.slice().reverse().forEach((p, i, a) => { if (!p) { env.wpc.plugins.splice(a.length - 1 - i, 1); }});
};


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build specific environment
 * @returns {(WebpackPluginInstance | undefined)[]}
 */
const webviewPlugins = (env) =>
{
	/** @type {(WebpackPluginInstance | undefined)[]} */
	const plugins = [];
	if (env.build === "webview")
	{
		const apps = Object.keys(env.app.vscode.webview.apps);
		plugins.push(
			cssextract(env),           //
			...webviewapps(apps, env), //
			// @ts-ignore
			htmlcsp(env),              //
			htmlinlinechunks(env),     //
			...copy(apps, env),        // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
			imageminimizer(env)        //
		);
	}
	return plugins;
};


module.exports = plugins;

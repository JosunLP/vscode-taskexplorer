/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.exports.plugins
 */

const {
	analyze, banner, build, clean, compilation, copy, customize, define, environment, finalize,
	hash, instrument, loghooks, ignore,optimization, prehash, progress, sourcemaps, tscheck,
	upload, cssextract, htmlcsp, imageminimizer, htmlinlinechunks, webviewapps, scm
} = require("../plugin");

/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build specific environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const plugins = (env, wpConfig) =>
{
	wpConfig.plugins = [];

	wpConfig.plugins.push(
		environment(env, wpConfig),              // compiler.hooks.environment
		customize(env, wpConfig),                // compiler.hooks.afterEnvironment - custom mods to installed plugins
		progress(env, wpConfig),
		...loghooks(env, wpConfig),              // logs all compiler.hooks.* when they run
		prehash(env, wpConfig),                  // compiler.hooks.initialize
		clean(env, wpConfig),                    // compiler.hooks.emit, compiler.hooks.done
		build(env, wpConfig),                    // compiler.hooks.beforeCompile
		compilation(env, wpConfig),              // compiler.hooks.compilation - e.g. add istanbul ignores to node-requires
		define(env, wpConfig),                   // compiler.hooks.compilation
		instrument(env, wpConfig),               // ? - TODO -?
		ignore(env, wpConfig),                   // compiler.hooks.normalModuleFactory
		...tscheck(env, wpConfig),               // compiler.hooks.afterEnvironment, hooks.afterCompile
	);

	if (env.build === "webview")
	{
		const apps = Object.keys(env.app.vscode.webview.apps);
		wpConfig.plugins.push(
			cssextract(env, wpConfig),           //
			...webviewapps(apps, env, wpConfig), //
			// @ts-ignore
			htmlcsp(env, wpConfig),              //
			htmlinlinechunks(env, wpConfig),     //
			...copy(apps, env, wpConfig),        // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
			imageminimizer(env, wpConfig)        //
		);
	}
	else if (env.build !== "tests")
	{
		wpConfig.plugins.push(
			sourcemaps(env, wpConfig),           // compiler.hooks.compilation -> compilation.hooks.processAssets
			banner(env, wpConfig),               // compiler.hooks.compilation -> compilation.hooks.processAssets
			...copy([], env, wpConfig),          // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
			analyze.bundle(env, wpConfig),       // compiler.hooks.done
			analyze.visualizer(env, wpConfig),   // compiler.hooks.emit
			analyze.circular(env, wpConfig)      // compiler.hooks.compilation -> compilation.hooks.optimizeModules
		);
	}

	wpConfig.plugins.push(                       // compiler.hooks.compilation -> compilation.hooks.optimizeChunks, ...
		...optimization(env, wpConfig),          // ^compiler.hooks.shouldEmit, compiler.hooks.compilation -> compilation.hooks.shouldRecord
		hash(env, wpConfig),                     // compiler.hooks.done
		upload(env, wpConfig),                   // compiler.hooks.afterDone
		finalize(env, wpConfig),                 // compiler.hooks.shutdown
		scm(env, wpConfig)                       // compiler.hooks.shutdown
	);

	wpConfig.plugins.slice().reverse().forEach((p, i, a) =>
	{
		if (!p) {
			wpConfig.plugins.splice(a.length - 1 - i, 1);
		}
	});
};


module.exports = plugins;

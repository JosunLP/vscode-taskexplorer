/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.exports.plugins
 */

const webviewApps = require("../webviewApps");
const {
	analyze, banner, build, clean, compile, copy, finalize, hash, hookSteps, ignore,
	optimization, prehash, progress, sourcemaps, tscheck, upload, cssextract, htmlcsp,
	imageminimizer, htmlinlinechunks, webviewapps, asset, scm
} = require("../plugin");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build specific environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const plugins = (env, wpConfig) =>
{
	wpConfig.plugins = [];

	if (env.verbosity &&  env.verbosity !== "none")
	{
		wpConfig.plugins.push(
			progress(env, wpConfig)
		);
	}

	wpConfig.plugins.push(
		prehash(env, wpConfig),                  // compiler.hooks.initialize
		clean(env, wpConfig),                    // compiler.hooks.emit, compiler.hooks.done
		build(env, wpConfig),                    // compiler.hooks.beforeCompile
		compile(env, wpConfig),                  // compiler.hooks.emit
		ignore(env, wpConfig),                   // compiler.hooks.normalModuleFactory
		...tscheck(env, wpConfig),               // compiler.hooks.afterEnvironment, hooks.afterCompile
		...hookSteps(env, wpConfig)              // compiler.hooks.*
	);

	if (env.build === "webview")
	{
		const apps = Object.keys(webviewApps);
		wpConfig.plugins.push(
			cssextract(env, wpConfig),           //
			...webviewapps(apps, env, wpConfig), //
			// @ts-ignore
			htmlcsp(env, wpConfig),              //
			htmlinlinechunks(env, wpConfig),     //
			copy(apps, env, wpConfig),           // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
			imageminimizer(env, wpConfig)        //
		);
	}
	else if (env.build !== "tests")
	{
		wpConfig.plugins.push(
			sourcemaps(env, wpConfig),           // compiler.hooks.compilation -> compilation.hooks.processAssets
			banner(env, wpConfig),               // compiler.hooks.compilation -> compilation.hooks.processAssets
			copy([], env, wpConfig),             // compiler.hooks.thisCompilation -> compilation.hooks.processAssets
			analyze.bundle(env, wpConfig),       // compiler.hooks.done
			analyze.visualizer(env, wpConfig),   // compiler.hooks.emit
			analyze.circular(env, wpConfig)      // compiler.hooks.compilation -> compilation.hooks.optimizeModules
		);
	}

	wpConfig.plugins.push(                       // compiler.hooks.compilation -> compilation.hooks.optimizeChunks, ...
		...optimization(env, wpConfig),          // ^ compiler.hooks.shouldEmit, compiler.hooks.compilation -> compilation.hooks.shouldRecord
		hash(env, wpConfig),                     // compiler.hooks.done
		upload(env, wpConfig),                   // compiler.hooks.afterDone
		asset(env, wpConfig),                    //
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

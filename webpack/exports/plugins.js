/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.exports.plugins
 */

const webviewApps = require("../webviewApps");
const {
	analyze, asset, banner, build, clean, copy, hash, hookSteps, ignore, optimization, prehash, /* progress, */
	sourcemaps, tscheck, upload, cssextract, htmlcsp, imageminimizer, htmlinlinechunks, webviewapps
} = require("../plugin");


/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const plugins = (env, wpConfig) =>
{
	wpConfig.plugins = [
		// progress(env, wpConfig),
		prehash(env, wpConfig),
		clean(env, wpConfig),
		build(env, wpConfig),
		ignore(env, wpConfig),
		...tscheck(env, wpConfig),
		...hookSteps(env)
	];

	if (env.build !== "tests")
	{
		if (env.build === "webview")
		{
			const apps = Object.keys(webviewApps);
			wpConfig.plugins.push(
				cssextract(env, wpConfig),
				...webviewapps(apps, env, wpConfig),
				// @ts-ignore
				htmlcsp(env, wpConfig),
				htmlinlinechunks(env, wpConfig),
				copy(apps, env, wpConfig),
				imageminimizer(env, wpConfig)
			);
		}
		else
		{
			wpConfig.plugins.push(
				sourcemaps(env, wpConfig),
				copy([], env, wpConfig),
				analyze.bundle(env, wpConfig),
				analyze.visualizer(env, wpConfig),
				analyze.circular(env, wpConfig),
				banner(env, wpConfig)
			);
		}

		wpConfig.plugins.push(
			...optimization(env, wpConfig),
			hash(env, wpConfig),
			asset(env, wpConfig),
			upload(env, wpConfig)
		);
	}

	wpConfig.plugins.slice().reverse().forEach((p, index, object) =>
	{
		if (!p) {
			/** @type {(WebpackPluginInstance|undefined)[]} */(wpConfig.plugins).splice(object.length - 1 - index, 1);
		}
	});
};

module.exports = plugins;

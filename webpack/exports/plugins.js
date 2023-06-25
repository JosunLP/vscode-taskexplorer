// @ts-check

const { wpPlugin } = require("../plugin");

/**
 * @module webpack.exports.plugins
 */

/** @typedef {import("../types/webpack").WebpackBuild} WebpackBuild */
/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */

/** ******************************************************************************************
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! IMPORTANT NOTE !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! NEW VIEWS/PAGES NEED TO BE ADDED HERE IN ORDER TO BE COMPILED !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 ********************************************************************************************/
const webviewApps =
{
	home: "./home/home.ts",
	license: "./license/license.ts",
	monitor: "./monitor/monitor.tsx",
	parsingReport: "./parsingReport/parsingReport.ts",
	releaseNotes: "./releaseNotes/releaseNotes.ts",
	taskCount: "./taskCount/taskCount.ts",
	taskDetails: "./taskDetails/taskDetails.ts",
	taskUsage: "./taskUsage/taskUsage.ts",
	welcome: "./welcome/welcome.ts",
};


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
export const plugins = (env, wpConfig) =>
{
	wpConfig.plugins = [
		wpPlugin.clean(env, wpConfig),
		wpPlugin.beforecompile(env, wpConfig),
		...wpPlugin.tscheck(env, wpConfig)
	];

	if (env.build !== "tests")
	{
		if (env.build === "webview")
		{
			const apps = Object.keys(webviewApps);
			wpConfig.plugins.push(
				wpPlugin.cssextract(env, wpConfig),
				...wpPlugin.webviewapps(apps, env, wpConfig),
				// @ts-ignore
				wpPlugin.htmlcsp(env, wpConfig),
				wpPlugin.htmlinlinechunks(env, wpConfig),
				wpPlugin.copy(apps, env, wpConfig),
				wpPlugin.imageminimizer(env, wpConfig)
			);
		}
		else
		{
			wpConfig.plugins.push(
				wpPlugin.sourcemaps(env, wpConfig),
				wpPlugin.limitchunks(env, wpConfig),
				wpPlugin.copy([], env, wpConfig),
				wpPlugin.analyze.bundle(env, wpConfig),
				wpPlugin.analyze.visualizer(env, wpConfig),
				wpPlugin.analyze.circular(env, wpConfig),
				wpPlugin.banner(env, wpConfig)
			);
		}
	}

	wpConfig.plugins.push(
		wpPlugin.optimize.noEmitOnError(env, wpConfig),
		wpPlugin.afterdone(env, wpConfig)
	);

	wpConfig.plugins.slice().reverse().forEach((p, index, object) =>
	{
		if (!p) {
			/** @type {(WebpackPluginInstance|undefined)[]} */(wpConfig.plugins).splice(object.length - 1 - index, 1);
		}
	});
};

// @ts-check

/**
 * @file exports/stats.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */

/**
 * @function stats
 * @param {WpBuildApp} app Webpack build environment
 */
const stats = (app) =>
{
	if (app.rc.exports.stats)
	{
		app.wpc.stats = {
			preset: "errors-warnings",
			assets: true,
			colors: true,
			env: true,
			errorsCount: true,
			warningsCount: true,
			timings: true
			// warningsFilter: /Cannot find module \'common\' or its corresponding type declarations/
		};

		app.wpc.infrastructureLogging = {
			colors: true,
			level: app.verbosity || "none"
		};
	}
};


module.exports = stats;

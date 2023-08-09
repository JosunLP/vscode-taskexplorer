// @ts-check

/**
 * @module wpbuild.exports.stats
 */

/** @typedef {import("../types").WpBuildApp} WpBuildApp */

/**
 * @function stats
 * @param {WpBuildApp} app Webpack build environment
 */
const stats = (app) =>
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
};


module.exports = stats;

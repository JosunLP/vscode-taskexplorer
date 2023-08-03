// @ts-check

/**
 * @module wpbuild.exports.stats
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

/**
 * @function stats
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const stats = (env) =>
{
	env.wpc.stats = {
		preset: "errors-warnings",
		assets: true,
		colors: true,
		env: true,
		errorsCount: true,
		warningsCount: true,
		timings: true
		// warningsFilter: /Cannot find module \'common\' or its corresponding type declarations/
	};

	env.wpc.infrastructureLogging = {
		colors: true,
		level: env.verbosity || "none"
	};
};


module.exports = stats;

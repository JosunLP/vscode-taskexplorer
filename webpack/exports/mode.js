// @ts-check

/**
 * @module wpbuild.exports.mode
 */

/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const mode = (env) =>
{
	env.wpc.mode = getMode(env, env.argv);
	if (!env.environment)
	{
		if (env.wpc.mode === "development") {
			env.environment = "dev";
		}
		else if (env.wpc.mode === "none") {
			env.environment = "test";
		}
		else {
			env.environment = "prod";
		}
	}
};


/**
 * @function
 * @param {Partial<WpBuildEnvironment>} env Webpack build environment
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @returns {WebpackMode}
 */
const getMode = (env, argv) =>
{
	let mode = argv.mode;
	if (!mode)
	{
		if (env.environment === "dev") {
			mode = "development";
		}
		else if (env.environment === "test" || env.build === "tests") {
			mode = "none";
		}
		else {
			mode = "production";
		}
	}
	return mode;
};


module.exports = { mode, getMode };

// @ts-check

/**
 * @module webpack.exports.mode
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {{ mode: "none"|"development"|"production"|undefined, env: WebpackEnvironment, config: String[] }} WebpackArgs */


/**
 * @method
 * @param {Partial<WebpackEnvironment>} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const mode = (env, argv, wpConfig) =>
{
	wpConfig.mode = getMode(env, argv);
	if (!env.environment)
	{
		if (wpConfig.mode === "development") {
			env.environment = "dev";
		}
		else if (wpConfig.mode === "none") {
			env.environment = "test";
		}
		else {
			env.environment = "prod";
		}
	}
};


/**
 * @method
 * @param {Partial<WebpackEnvironment>} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
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

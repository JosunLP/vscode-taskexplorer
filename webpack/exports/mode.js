// @ts-check

/**
 * @module webpack.exports.mode
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {{ mode: "none"|"development"|"production"|undefined, env: WebpackEnvironment, config: String[] }} WebpackArgs */


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const mode = (env, argv, wpConfig) =>
{
	wpConfig.mode = getMode(env, argv);
	if (argv.mode === "development") {
		env.environment = "dev";
	}
	else if (argv.mode === "none") {
		env.environment = "test";
	}
	else {
		env.environment = "prod";
	}
};


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
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

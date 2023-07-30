/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.environment
 */

const { globalEnv } = require("../utils/global");
const { writeInfo, write } = require("../utils/console");

/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @returns {WebpackPluginInstance | undefined}
 */
const environment = (env, wpConfig, argv) =>
{
	if (env.app.plugins.environment !== false)
	{
		return {
			apply: (compiler) =>
			{
				compiler.hooks.environment.tap("WpBuildCustomizePlugin", () =>
				{
					setVersion(env);
					writeEnvironment(env, argv);
				});
			}
		};
	}
};


/**
 * @function setVersion
 * @param {WpBuildEnvironment} env
 */
const setVersion = (env) =>
{
    if (env.build === "extension" && env.environment === "prod")
    {
        // let version = env.app.version;
    }
};


/**
 * @function writeEnvironment
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 */
const writeEnvironment = (env, argv) =>
{
	write("Build Environment:");
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(15)}: ${env[k]}`)
	);
	write("Global Environment:");
	Object.keys(globalEnv).filter(k => typeof globalEnv[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(15)}: ${globalEnv[k]}`)
	);
	if (argv)
	{
		write("Arguments:");
		if (argv.mode) {
			writeInfo(`   mode           : ${argv.mode}`);
		}
		if (argv.watch) {
			writeInfo(`   watch          : ${argv.config.join(", ")}`);
		}
		if (argv.config) {
			writeInfo(`   config         : ${argv.config.join(", ")}`);
		}
	}
};


module.exports = environment;

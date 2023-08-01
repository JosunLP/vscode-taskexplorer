/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.environment
 */

const { globalEnv } = require("../utils/global");
const { writeInfo, write } = require("../utils/console");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const environment = (env, wpConfig) =>
{
	if (env.app.plugins.environment !== false)
	{
		return {
			apply: (compiler) =>
			{
				compiler.hooks.environment.tap("WpBuildEnvironmentPlugin", () =>
				{
					setVersion(env);
					writeEnvironment(env);
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
 */
const writeEnvironment = (env) =>
{
	write("Build Environment:");
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(15)}: ${env[k]}`)
	);
	write("Global Environment:");
	Object.keys(globalEnv).filter(k => typeof globalEnv[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(15)}: ${globalEnv[k]}`)
	);
	if (env.argv)
	{
		write("Arguments:");
		if (env.argv.mode) {
			writeInfo(`   mode           : ${env.argv.mode}`);
		}
		if (env.argv.watch) {
			writeInfo(`   watch          : ${env.argv.watch}`);
		}
		if (env.argv.config) {
			writeInfo(`   config         : ${env.argv.config.join(", ")}`);
		}
	}
};


module.exports = environment;

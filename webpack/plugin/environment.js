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
	const pad = env.app.logPad.value;
	write("Build Environment:", env);
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(pad - 3)}: ${env[k]}`, env)
	);
	write("Global Environment:", env);
	Object.keys(globalEnv).filter(k => typeof globalEnv[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(pad - 3)}: ${globalEnv[k]}`, env)
	);
	if (env.argv)
	{
		write("Arguments:", env);
		if (env.argv.mode) {
			writeInfo(`   ${"mode".padEnd(pad - 3)}: ${env.argv.mode}`, env);
		}
		if (env.argv.watch) {
			writeInfo(`   ${"watch".padEnd(pad - 3)}: ${env.argv.watch}`, env);
		}
		if (env.argv.config) {
			writeInfo(`   ${"cfg".padEnd(pad - 3)}: ${env.argv.config.join(", ")}`, env);
		}
	}
};


module.exports = environment;

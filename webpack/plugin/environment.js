/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.environment
 */

const { globalEnv } = require("../utils/global");

/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildEnvironment} env
 * @returns {WebpackPluginInstance | undefined}
 */
const environment = (env) =>
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
	const logger = env.logger,
		  pad = env.app.logPad.value;
		  logger.write("Build Environment:", env);
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach(
		(k) => logger.writeInfo(`   ${k.padEnd(pad - 3)}: ${env[k]}`, env)
	);
	logger.write("Global Environment:", env);
	Object.keys(globalEnv).filter(k => typeof globalEnv[k] !== "object").forEach(
		(k) => logger.writeInfo(`   ${k.padEnd(pad - 3)}: ${globalEnv[k]}`, env)
	);
	if (env.argv)
	{
		logger.write("Arguments:", env);
		if (env.argv.mode) {
			logger.writeInfo(`   ${"mode".padEnd(pad - 3)}: ${env.argv.mode}`, env);
		}
		if (env.argv.watch) {
			logger.writeInfo(`   ${"watch".padEnd(pad - 3)}: ${env.argv.watch}`, env);
		}
		if (env.argv.config) {
			logger.writeInfo(`   ${"cfg".padEnd(pad - 3)}: ${env.argv.config.join(", ")}`, env);
		}
	}
};


module.exports = environment;

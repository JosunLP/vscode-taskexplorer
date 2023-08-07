/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/environment.js
 * @author Scott Meesseman
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
		  pad = env.app.log.pad.value;
	logger.write("Build Environment:", 1, "", 0, logger.colors.white);
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach(
		(k) => logger.write(`   ${k.padEnd(pad - 3)}: ${env[k]}`, 1)
	);
	logger.write("Global Environment:", 1, "", 0, logger.colors.white);
	Object.keys(globalEnv).filter(k => typeof globalEnv[k] !== "object").forEach(
		(k) => logger.write(`   ${k.padEnd(pad - 3)}: ${globalEnv[k]}`, 1)
	);
	if (env.argv)
	{
		logger.write("Arguments:", 1, "", 0, logger.colors.white);
		if (env.argv.mode) {
			logger.write(`   ${"mode".padEnd(pad - 3)}: ${env.argv.mode}`, 1);
		}
		if (env.argv.watch) {
			logger.write(`   ${"watch".padEnd(pad - 3)}: ${env.argv.watch}`, 1);
		}
		if (env.argv.config) {
			logger.write(`   ${"cfg".padEnd(pad - 3)}: ${env.argv.config.join(", ")}`, 1);
		}
	}
};


module.exports = environment;

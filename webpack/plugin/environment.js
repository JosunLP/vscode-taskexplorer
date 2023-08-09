/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildBasePlugin = require("./base");
const { globalEnv } = require("../utils/global");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildDisposePlugin
 */
class WpBuildENvironmentPlugin extends WpBuildBasePlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            finishEnvironmentInitialization: {
                hook: "environment",
                callback: this.environment.bind(this)
            }
        });
    }


	/**
	 * @function
	 * @private
	 * @member environment
	 */
	environment = () =>
	{
		this.setVersion();
		this.logEnvironment();
	};


	/**
	 * @function
	 * @private
	 * @member logEnvironment
	 */
	logEnvironment = () =>
	{
		const env = this.env,
			  logger = env.logger,
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


	/**
	 * @function
	 * @private
	 * @member setVersion
	 */
	setVersion = () =>
	{
		if (this.env.isMain && this.env.environment === "prod")
		{
			// let version = env.app.version;
		}
	};

}


/**
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildENvironmentPlugin | undefined}
 */
const environment = (env) => env.app.plugins.environment && env.environment === "prod" ? new WpBuildENvironmentPlugin({ env }) : undefined;


module.exports = environment;

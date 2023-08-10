/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildPlugin = require("./base");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildDisposePlugin
 */
class WpBuildEnvironmentPlugin extends WpBuildPlugin
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
		const app = this.app,
			  logger = app.logger,
			  pad = app.rc.log.pad.value;

		logger.write("Build Environment:", 1, "", 0, logger.colors.white);
		Object.keys(app.argv.env).filter(k => typeof app.argv.env[k] !== "object").forEach(
			(k) => logger.write(`   ${k.padEnd(pad - 3)}: ${app.argv.env[k]}`, 1)
		);

		logger.write("Global Environment:", 1, "", 0, logger.colors.white);
		Object.keys(app.global).filter(k => typeof app.global[k] !== "object").forEach(
			(k) => logger.write(`   ${k.padEnd(pad - 3)}: ${app.global[k]}`, 1)
		);

		if (app.argv)
		{
			logger.write("Arguments:", 1, "", 0, logger.colors.white);
			if (app.argv.mode) {
				logger.write(`   ${"mode".padEnd(pad - 3)}: ${app.argv.mode}`, 1);
			}
			if (app.argv.watch) {
				logger.write(`   ${"watch".padEnd(pad - 3)}: ${app.argv.watch}`, 1);
			}
			if (app.argv.config) {
				logger.write(`   ${"cfg".padEnd(pad - 3)}: ${app.argv.config.join(", ")}`, 1);
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
		if (this.app.isMain && this.app.environment === "prod")
		{
			// let version = app.rc.version;
		}
	};

}


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildEnvironmentPlugin | undefined}
 */
const environment = (app) => app.rc.plugins.environment && app.environment === "prod" ? new WpBuildEnvironmentPlugin({ app }) : undefined;


module.exports = environment;

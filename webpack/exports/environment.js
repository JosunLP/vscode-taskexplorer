/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module webpack.exports.environment
 */

const { join } = require("path");
const { writeInfo } = require("../console");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackBuild} WebpackBuild */
/** @typedef {{ mode: "none"|"development"|"production"|undefined, env: WebpackEnvironment, config: String[] }} WebpackArgs */


/**
 * @method environment
 * @param {WebpackBuild} buildTarget
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 */
const environment = (buildTarget, env, argv) =>
{
	env.build = buildTarget;
	env.buildPath = __dirname;
	if (env.build === "webview") {
		env.basePath = join(__dirname, "src", "webview", "app");
	}
	else {
		env.basePath = __dirname;
	}
	writeInfo("Environment:");
	Object.keys(env).forEach((k) => { writeInfo(`   ${k.padEnd(15)}: ${env[k]}`); });
	if (argv)
	{
		writeInfo("Arguments:");
		if (argv.mode) {
			writeInfo(`   mode          : ${argv.mode}`);
		}
		if (argv.config) {
			writeInfo(`   config        : ${argv.config.join(", ")}`);
		}
	}
};


module.exports = environment;

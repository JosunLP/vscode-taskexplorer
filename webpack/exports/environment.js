/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module webpack.exports.environment
 */

const { readFileSync } = require("fs");
const { join, resolve } = require("path");
const { writeInfo } = require("../console");

/** @typedef {import("..//types/webpack").WebpackArgs} WebpackArgs */
/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackBuild} WebpackBuild */


/**
 * @method environment
 * @param {WebpackBuild} buildTarget
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 */
const environment = (buildTarget, env, argv) =>
{
	env.build = buildTarget;
	env.buildPath = resolve(__dirname, "..", "..");
	if (env.build === "webview") {
		env.basePath = join(env.buildPath, "src", "webview", "app");
	}
	else {
		env.basePath = env.buildPath;
	}
	const pkgJson = JSON.parse(readFileSync(join(env.buildPath, "package.json"), "utf8"));
	Object.assign(env, { app: pkgJson.name, version: pkgJson.version });
	writeInfo("Environment:");
	Object.keys(env).forEach((k) => { writeInfo(`   ${k.padEnd(15)}: ${env[k]}`); });
	if (argv)
	{
		writeInfo("Arguments:");
		if (argv.mode) {
			writeInfo(`   mode          : ${argv.mode}`);
		}
		if (argv.watch) {
			writeInfo(`   watch         : ${argv.config.join(", ")}`);
		}
		if (argv.config) {
			writeInfo(`   config        : ${argv.config.join(", ")}`);
		}
	}
};


module.exports = environment;

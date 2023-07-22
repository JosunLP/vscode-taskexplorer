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
 * @param {WebpackBuild} build
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 */
const environment = (build, env, argv) =>
{
	env.build = build;
	env.buildPath = resolve(__dirname, "..", "..");
	env.distPath = join(env.buildPath, "dist");
	env.tempPath = resolve(process.env.TEMP || process.env.TMP  || ".");
	if (env.build === "webview") {
		env.basePath = join(env.buildPath, "src", "webview", "app");
	}
	else {
		env.basePath = env.buildPath;
	}
	readPackageDotJson(env);
	writeEnvironment(env, argv);
	env.isTests = env.environment.startsWith("test");
};


/**
 * @method readPackageDotJson
 * @param {WebpackEnvironment} env Webpack build environment
 */
const readPackageDotJson = (env) =>
{
	const pkgJson = JSON.parse(readFileSync(join(env.buildPath, "package.json"), "utf8"));
	Object.assign(env, { app: pkgJson.name, version: pkgJson.version, pkgJson });
	version(env);
};


/**
 * @method version
 * @param {WebpackEnvironment} env
 */
const version = (env) =>
{
    if (env.build === "extension" && env.environment === "prod" && env.stripLogging)
    {
        // let version = env.version;
    }
};


/**
 * @method writeEnvironment
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 */
const writeEnvironment = (env, argv) =>
{
	writeInfo("Environment:");
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach((k) => writeInfo(`   ${k.padEnd(15)}: ${env[k]}`));
	if (argv)
	{
		writeInfo("Arguments:");
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

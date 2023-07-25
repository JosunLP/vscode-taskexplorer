/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module webpack.exports.environment
 */

const { join, resolve } = require("path");
const { writeInfo } = require("../console");
const { readFileSync, existsSync, mkdirSync } = require("fs");
const { apply } = require("../utils");

/** @typedef {import("..//types").WebpackArgs} WebpackArgs */
/** @typedef {import("../types").WebpackBuild} WebpackBuild */
/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackGlobalEnvironment} WebpackGlobalEnvironment */


/** @type {WebpackGlobalEnvironment} */
const globalEnv = { buildCount: 0 };


/**
 * @method environment
 * @param {WebpackBuild} build
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackGlobalEnvironment} gEnv Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 */
const environment = (build, env, gEnv, argv) =>
{
	apply(globalEnv, gEnv);
	env.build = build;
	env.paths.build = resolve(__dirname, "..", ".."); // build path must be set b4 proceeding...
	env.isTests = env.environment.startsWith("test");
	setApp(env);
	setPaths(env);
	initState(env);
	setVersion(env);
	writeEnvironment(env, argv);
};


/**
 * @method setState
 * @param {WebpackEnvironment} env Webpack build environment
 */
const initState = (env) =>
{
	env.state = { hash: { current: {}, next: {} } };
};


/**
 * @method readPkgJson
 * @param {WebpackEnvironment} env Webpack build environment
 */
const setApp = (env) =>
{
	const pkgJson = JSON.parse(readFileSync(join(env.paths.build, "package.json"), "utf8"));
	apply(env,
	{
		/** @type {import("..//types").WebpackApp} */
		app: {
			mainChunk: "taskexplorer",
			name: pkgJson.name,
			version: pkgJson.version,
			pkgJson
		}
	});
};


/**
 * @method setPaths
 * @param {WebpackEnvironment} env Webpack build environment
 */
const setPaths = (env) =>
{
	env.paths.dist = join(env.paths.build, "dist");
	env.paths.temp = resolve(process.env.TEMP || process.env.TMP  || ".", env.app.name, env.environment);
	env.paths.cache = join(env.paths.build, "node_modules", ".cache", "webpack");
	env.paths.files.hash = join(env.paths.cache, `hash.${env.environment}${!env.stripLogging ? ".debug" : ""}.json`);
	if (!existsSync(env.paths.cache)) {
		mkdirSync(env.paths.cache, { recursive: true });
	}
	if (env.build === "webview") {
		env.paths.base = join(env.paths.build, "src", "webview", "app");
	}
	else {
		env.paths.base = env.paths.build;
	}
};


/**
 * @method version
 * @param {WebpackEnvironment} env
 */
const setVersion = (env) =>
{
    if (env.build === "extension" && env.environment === "prod" && env.stripLogging)
    {
        // let version = env.app.version;
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
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(15)}: ${env[k]}`)
	);
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


module.exports = { environment, globalEnv };

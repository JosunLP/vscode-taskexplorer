/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module webpack.exports.environment
 */

const { join, resolve } = require("path");
const { WebpackError } = require("webpack");
const globalEnv = require("../utils/global");
const { writeInfo, figures } = require("../utils/console");
const { merge, isObjectEmpty } = require("../utils/utils");
const { readFileSync, existsSync, mkdirSync } = require("fs");

/** @typedef {import("../types").IWebpackApp} IWebpackApp */
/** @typedef {import("../types").WebpackArgs} WebpackArgs */
/** @typedef {import("../types").WebpackBuild} WebpackBuild */
/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */


/**
 * @function environment
 * @param {WebpackBuild} build
 * @param {IWebpackApp} app Webpack app config, read from `.wpbuildrc.json` and `package.json`
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const environment = (build, app, env, argv, wpConfig) =>
{
	env.build = build;
	env.paths.build = resolve(__dirname, "..", "..");
	setEnvironment(env, argv, wpConfig); // i.e. env.environment = < `prod`, `dev`, or `test` >
	setApp(app, env);
	setPaths(env);
	initState(env);
	setVersion(env);
	writeEnvironment(env, argv);
};


/**
 * @function setState
 * @param {WebpackEnvironment} env Webpack build environment
 */
const initState = (env) => { env.state = { hash: { current: {}, next: {} } }; };


/**
 * @function readPkgJson
 * @param {IWebpackApp} app Webpack app config, read from `.wpbuildrc.json` and `package.json`
 * @param {WebpackEnvironment} env Webpack build environment
 */
const setApp = (app, env) =>
{
	merge(env, { app });
	if (!env.app.pkgJson || isObjectEmpty(env.app.pkgJson))
	{
		const pkgJsonPath = join(env.paths.build, "package.json");
		env.app.pkgJson = {};
		if (existsSync(pkgJsonPath)) {
			Object.assign(env.app.pkgJson, JSON.parse(readFileSync(pkgJsonPath, "utf8")));
		}
	}
};


/**
 * @function setEnvironment
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @param {WebpackConfig} wpConfig Webpack config object
 * @throws {Error}
 */
const setEnvironment = (env, argv, wpConfig) =>
{
	if (!env.environment)
	{
		if (wpConfig.mode === "development" || argv.mode === "development") {
			env.environment = "dev";
		}
		else if (wpConfig.mode === "production" || argv.mode === "production") {
			env.environment = "prod";
		}
		else if (wpConfig.mode === "none" || argv.mode === "none") {
			env.environment = "test";
		}
		else {
			const eMsg = "Could not detect build environment";
			writeInfo("Could not detect build environment", figures.color.error);
			throw new WebpackError(eMsg);
		}
	}
	env.isTests = env.environment.startsWith("test");
};


/**
 * @function setPaths
 * @param {WebpackEnvironment} env Webpack build environment
 */
const setPaths = (env) =>
{
	merge(env.paths,
	{
		base: env.build !== "webview" ? env.paths.build : join(env.paths.build, "src", "webview", "app"),
		dist: join(env.paths.build, "dist"),
		temp: resolve(process.env.TEMP || process.env.TMP  || ".", env.app.name, env.environment),
		cache: join(env.paths.build, "node_modules", ".cache", "webpack")
	});
	merge(env.paths.files,
	{
		sourceMapWasm: "node_modules/source-map/lib/mappings.wasm",
		hash: join(env.paths.cache, `hash.${env.environment}${env.buildMode === "debug" ? ".debug" : ""}.json`)
	});
	env.paths.distBuild = env.buildMode !== "debug" ? env.paths.dist : env.paths.temp;
	if (!existsSync(env.paths.cache)) { mkdirSync(env.paths.cache, { recursive: true }); }
	if (!existsSync(env.paths.temp)) { mkdirSync(env.paths.temp, { recursive: true }); }
};


/**
 * @function setVersion
 * @param {WebpackEnvironment} env
 */
const setVersion = (env) =>
{
    if (env.build === "extension" && env.environment === "prod" && env.buildMode === "release")
    {
        // let version = env.app.version;
    }
};


/**
 * @function writeEnvironment
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 */
const writeEnvironment = (env, argv) =>
{
	writeInfo("Build Environment:");
	Object.keys(env).filter(k => typeof env[k] !== "object").forEach(
		(k) => writeInfo(`   ${k.padEnd(15)}: ${env[k]}`)
	);
	writeInfo("Global Environment:");
	Object.keys(globalEnv).filter(k => typeof env[k] !== "object").forEach(
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


module.exports = environment;

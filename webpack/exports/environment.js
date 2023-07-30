/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module webpack.exports.environment
 */

const { join, resolve } = require("path");
const { merge } = require("../utils/utils");
const { WebpackError } = require("webpack");
const { existsSync, mkdirSync } = require("fs");
const { globalEnv } = require("../utils/global");
const { writeInfo, figures } = require("../utils/console");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function environment
 * @param {WpBuildModule} build
 * @param {WpBuildApp} app Webpack app config, read from `.wpbuildrc.json` and `package.json`
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const environment = (build, app, env, argv, wpConfig) =>
{
	env.build = build;
	env.paths.build = resolve(__dirname, "..", "..");
	env.state = { hash: { current: {}, next: {} } };
	merge(env, { app });
	setEnvironment(env, argv, wpConfig);
	setPaths(env);
};


/**
 * @function setEnvironment
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WpBuildWebpackArgs} argv Webpack command line args
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
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const setPaths = (env) =>
{
	const wvBase = env.app.vscode.webview.baseDIr;
	merge(env.paths,
	{
		base: env.build !== "webview" ? env.paths.build : (wvBase ? resolve(env.paths.build, wvBase) :
																	join(env.paths.build, "src", "webview", "app")),
		dist: join(env.paths.build, "dist"),
		temp: resolve(process.env.TEMP || process.env.TMP  || ".", env.app.name, env.environment),
		cache: globalEnv.cacheDir,
		files: {
			hash: join(globalEnv.cacheDir, `hash.${env.environment}.json`),
			sourceMapWasm: "node_modules/source-map/lib/mappings.wasm"
		}
	});
	if (!existsSync(env.paths.temp)) { mkdirSync(env.paths.temp, { recursive: true }); }
};


module.exports = environment;

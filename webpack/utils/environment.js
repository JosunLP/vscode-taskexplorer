/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module wpbuild.utils.environment
 */

const { mergeIf } = require("./utils");
const { globalEnv } = require("./global");
const { join, resolve } = require("path");
const { WebpackError } = require("webpack");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function Initializes the build-level and global environment objects
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const environment = (env) =>
{
	setBuildEnvironment(env);
	setGlobalEnvironment(env);
};


/**
 * @function
 * @private
 * @param {WpBuildEnvironment} env Webpack build environment
 * @throws {WebpackError}
 */
const setBuildEnvironment = (env) =>
{
	const logger = env.logger = new WpBuildConsoleLogger(env);

	if (!env.environment)
	{
		if (env.wpc.mode === "development" || env.argv.mode === "development") {
			env.environment = "dev";
		}
		else if (env.wpc.mode === "production" || env.argv.mode === "production") {
			env.environment = "prod";
		}
		else if (env.wpc.mode === "none" || env.argv.mode === "none") {
			env.environment = "test";
		}
		else {
			const eMsg = "Could not detect build environment";
			logger.writeInfo("Could not detect build environment", logger.figures.color.error);
			throw new WebpackError(eMsg);
		}
	}

	mergeIf(env, {
		analyze: false,
		clean: false,
		esbuild: false,
		imageOpt: true,
		isTests: env.environment.startsWith("test"),
		isWeb: env.target.startsWith("web"),
		isExtension: env.build === "extension" || env.build === "browser",
		isExtensionProd: env.build === "extension" || env.build === "browser" && env.environment === "prod",
		isExtensionTests: env.build === "extension" || env.build === "browser" && env.environment.startsWith("test"),
		global: globalEnv,
		paths: getPaths(env),
		preRelease: true,
		state: { hash: { current: {}, next: {}, previous: {} } },
		target: /** @type {WebpackTarget} */("node"),
		verbosity: undefined
	});

	Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
	{
		env[k] = env[k].toLowerCase() === "true"; // convert any string value `true` or `false` to actual boolean type
	});
};


/**
 * @function
 * @private
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const setGlobalEnvironment = (env) =>
{
	globalEnv.verbose = !!env.verbosity && env.verbosity !== "none";
};


/**
 * @function setPaths
 * @private
 * @param {WpBuildEnvironment} env Webpack build environment
 * @returns {WpBuildPaths}
 */
const getPaths = (env) =>
{
	const wvBase = env.app.vscode.webview.baseDir,
		  build = resolve(__dirname, "..", ".."),
		  temp = resolve(process.env.TEMP || process.env.TMP  || "dist", env.app.name, env.environment);
	if (!existsSync(temp)) {
		mkdirSync(temp, { recursive: true });
	}
	return {
		build, temp,
		base: env.build !== "webview" ? build : (wvBase ? resolve(build, wvBase) :
													join(build, "src", "webview", "app")),
		dist: join(build, "dist"), // = compiler.outputPath = compiler.options.output.path
		cache: globalEnv.cacheDir,
		files: {
			hash: join(globalEnv.cacheDir, `hash.${env.environment}.json`),
			sourceMapWasm: "node_modules/source-map/lib/mappings.wasm"
		}
	};
};


module.exports = environment;

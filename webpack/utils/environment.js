/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module wpbuild.utils.environment
 */

const { mergeIf, apply, isString, merge, isObjectEmpty } = require("./utils");
const { globalEnv } = require("./global");
const { join, resolve, isAbsolute } = require("path");
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
			logger.error("Could not detect build environment");
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
		logLevel: env.app.log.level || 0,
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
 * @function
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
	return merge(
	{
		build, temp,
		base: env.build !== "webview" ? build : (wvBase ? resolve(build, wvBase) :
													join(build, "src", "webview", "app")),
		dist: join(build, "dist"), // = compiler.outputPath = compiler.options.output.path
		distTests: join(build, "dist", "test"),
		cache: globalEnv.cacheDir,
		files: {
			hashStoreJson: join(globalEnv.cacheDir, `hash.${env.environment}.json`),
			sourceMapWasm: join(build, "node_modules", "source-map", "lib", "mappings.wasm")
		}
	}, resolveRcPaths(build, env.app.paths || {}));
};


/**
 * @function
 * @private
 * @param {string} dir
 * @param {WpBuildPaths} paths
 * @returns {WpBuildPaths}
 */
const resolveRcPaths = (dir, paths) =>
{
	Object.entries(paths).forEach((e) =>
	{
		if (isString(e[1], true))
		{
			if (!isAbsolute(e[1])) {
				paths[e[0]] = resolve(dir, e[1]);
			}
		}
		else {
			delete paths[e[0]];
		}
	});
	Object.entries(paths.files || {}).forEach((e) =>
	{
		if (isString(e[1], true))
		{
			if (!isAbsolute(e[1])) {
				paths.files[e[0]] = resolve(dir, e[1]);
			}
		}
		else {
			delete paths.files[e[0]];
		}
	});
	return apply({}, paths, { files: { ...paths.files }});
};


module.exports = environment;

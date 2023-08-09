/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
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


/**
 * @function Initializes the build-level and global environment objects
 * @param {WpBuildApp} app Webpack build environment
 */
const environment = (app) =>
{
	setBuildEnvironment(app);
	setGlobalEnvironment(app);
};


/**
 * @function
 * @private
 * @param {WpBuildApp} app Webpack build environment
 * @throws {WebpackError}
 */
const setBuildEnvironment = (app) =>
{
	const logger = app.logger = new WpBuildConsoleLogger(app);

	if (!app.environment)
	{
		if (app.wpc.mode === "development" || app.argv.mode === "development") {
			app.environment = "dev";
		}
		else if (app.wpc.mode === "production" || app.argv.mode === "production") {
			app.environment = "prod";
		}
		else if (app.wpc.mode === "none" || app.argv.mode === "none") {
			app.environment = "test";
		}
		else {
			const eMsg = "Could not detect build environment";
			logger.error("Could not detect build environment");
			throw new WebpackError(eMsg);
		}
	}

	mergeIf(app, {
		analyze: false,
		clean: false,
		disposables: [],
		esbuild: false,
		imageOpt: true,
		isTests: app.environment.startsWith("test"),
		isWeb: app.target.startsWith("web"),
		isMain: app.build === "extension" || app.build === "web",
		isMainProd: (app.build === "extension" || app.build === "web") && app.environment === "prod",
		isMainTests: (app.build === "extension" || app.build === "web") && app.environment.startsWith("test"),
		global: globalEnv,
		paths: getPaths(app),
		preRelease: true,
		target: /** @type {WebpackTarget} */("node"),
		verbosity: undefined
	});

	Object.keys(app).filter(k => typeof app[k] === "string" && /(?:true|false)/i.test(app[k])).forEach((k) =>
	{
		app[k] = app[k].toLowerCase() === "true"; // convert any string value `true` or `false` to actual boolean type
	});
};


/**
 * @function
 * @private
 * @param {WpBuildApp} app Webpack build environment
 */
const setGlobalEnvironment = (app) =>
{
	globalEnv.verbose = !!app.verbosity && app.verbosity !== "none";
};


/**
 * @function
 * @private
 * @param {WpBuildApp} app Webpack build environment
 * @returns {WpBuildPaths}
 */
const getPaths = (app) =>
{
	const wvBase = app.rc.vscode.webview.baseDir,
		  build = resolve(__dirname, "..", ".."),
		  temp = resolve(process.env.TEMP || process.env.TMP  || "dist", app.rc.name, app.environment);
	if (!existsSync(temp)) {
		mkdirSync(temp, { recursive: true });
	}
	return merge(
	{
		build, temp,
		base: app.build !== "webview" ? build : (wvBase ? resolve(build, wvBase) :
													join(build, "src", "webview", "app")),
		// base: app.build !== "webview" && app.build !== "tests" ? build :
		// 			(app.build === "webview" ? (wvBase ? resolve(build, wvBase) : join(build, "src", "webview", "app")) :
		// 			join(build, "dist", "test")),
		dist: join(build, "dist"), // = compiler.outputPath = compiler.options.output.path
		distTests: join(build, "dist", "test"),
		cache: globalEnv.cacheDir
	}, resolveRcPaths(build, app.paths || {}));
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

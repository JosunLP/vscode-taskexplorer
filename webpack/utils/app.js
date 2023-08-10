/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildRc = require("./rc");
const { globalEnv } = require("./global");
const { WebpackError } = require("webpack");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");
const { join, resolve, isAbsolute } = require("path");
const { mergeIf, apply, isString, merge } = require("./utils");
const { getMode } = require("../exports");


/** @typedef {import("../types").Disposable} Disposable */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").IWpBuildApp} IWpBuildApp */
/** @typedef {import("../types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildRcBuild} WpBuildRcBuild */
/** @typedef {import("../types").WebpackLogLevel} WebpackLogLevel */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildWebpackConfig} WpBuildWebpackConfig */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */
/** @typedef {import("../types").WpBuildGlobalEnvironment} WpBuildGlobalEnvironment */


/**
 * @class WpBuildApp
 * @implements {IWpBuildApp}
 */
class WpBuildApp
{
    /**
     * @member {boolean} analyze
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    analyze;
    /**
     * @member {WpBuildRuntimeEnvArgs} argv
     * @memberof WpBuildApp.prototype
     * @type {WpBuildRuntimeEnvArgs}
     */
    arge;
    /**
     * @member {WebpackRuntimeArgs} argv
     * @memberof WpBuildApp.prototype
     * @type {WebpackRuntimeArgs}
     */
    argv;
    /**
     * @member {WpBuildModule} build
     * @memberof WpBuildApp.prototype
     * @type {WpBuildModule}
     */
    build;
    /**
     * @member {boolean} clean
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    clean;
    /**
     * @member {Array<Disposable>} disposables
     * @memberof WpBuildApp.prototype
     * @type {Array<Disposable>}
     */
    disposables;
    /**
     * @member {WpBuildEnvironment} environment
     * @memberof WpBuildApp.prototype
     * @type {WpBuildEnvironment}
     */
    environment;
    /**
     * @member {boolean} esbuild
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    esbuild;
    /**
     * @member {boolean} imageOpt
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    imageOpt;
    /**
     * @member {boolean} isMain
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    isMain;
    /**
     * @member {boolean} isMainProd
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    isMainProd;
    /**
     * @member {boolean} isMainTests
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    isMainTests;
    /**
     * @member {boolean} isTests
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    isTests;
    /**
     * @member {boolean} isWeb
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    isWeb;
    /**
     * @member {WpBuildGlobalEnvironment} global
     * @memberof WpBuildApp.prototype
     * @type {WpBuildGlobalEnvironment}
     */
    global;
    /**
     * @member {WpBuildConsoleLogger} logger
     * @memberof WpBuildApp.prototype
     * @type {WpBuildConsoleLogger}
     */
    logger;
    /**
     * @member {WpBuildPaths} paths
     * @memberof WpBuildApp.prototype
     * @type {WpBuildPaths}
     */
    paths;
    /**
     * @member {boolean} preRelease
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    preRelease;
    /**
     * @member {WpBuildRc} analyze
     * @memberof WpBuildApp.prototype
     * @type {WpBuildRc}
     */
    rc;
    /**
     * @member {WebpackTarget} target
     * @memberof WpBuildApp.prototype
     * @type {WebpackTarget}
     */
    target;
    /**
     * @member {WebpackLogLevel} verbosity
     * @memberof WpBuildApp.prototype
     * @type {WebpackLogLevel}
     */
    verbosity;
    /**
     * @member {WpBuildWebpackConfig} wpc
     * @memberof WpBuildApp.prototype
     * @type {WpBuildWebpackConfig}
     */
    wpc;


	/**
	 * @class WpBuildApp
	 * @param {WebpackRuntimeArgs} argv Webpack command line argsmmand line args
	 * @param {WpBuildRuntimeEnvArgs} env Webpack build environment
	 * @param {WpBuildRcBuild} [build]
	 */
	constructor(argv, env, build)
	{
		merge(this, this.wpApp(argv, env, build));
		globalEnv.verbose = !!this.verbosity && this.verbosity !== "none";
	}


	/**
	 * @function
	 * @private
	 * @param {WebpackRuntimeArgs} argv Webpack command line argsmmand line args
	 * @param {WpBuildRuntimeEnvArgs} env Webpack build environment
	 * @param {WpBuildRcBuild} [build]
	 * @returns {WpBuildApp}
	 * @throws {WebpackError}
	 */
	wpApp = (argv, env, build) =>
	{
		/** @type {WpBuildApp} */
		const app = this;

		Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
		{
			env[k] = env[k].toLowerCase() === "true"; // convert any string value `true` or `false` to actual boolean type
		});

		apply(app,
		{
			...env,
			...build,
			argv,
			arge: env,
			global: globalEnv,
			disposables: [],
			wpc: {
				entry: {},
				mode: getMode(env, argv),
				output: {}
			}
		},
		{
			analyze: false,
			clean: false,
			esbuild: false,
			imageOpt: false,
			target: "node",
			verbosity: undefined
		});

		this.logger = new WpBuildConsoleLogger(app);

		if (!app.environment)
		{
			if (app.wpc.mode === "development" || argv.mode === "development") {
				app.environment = "dev";
			}
			else if (app.wpc.mode === "production" || argv.mode === "production") {
				app.environment = "prod";
			}
			else if (app.wpc.mode === "none" || argv.mode === "none") {
				app.environment = "test";
			}
			else {
				const eMsg = "Could not detect build environment";
				this.logger.error("Could not detect build environment");
				throw new WebpackError(eMsg);
			}
		}

		this.rc = new WpBuildRc(app);

		merge(app, {
			isTests: this.environment.startsWith("test"),
			isWeb: app.target.startsWith("web"),
			isMain: app.build === "extension" || app.build === "web",
			isMainProd: (app.build === "extension" || app.build === "web") && app.environment === "prod",
			isMainTests: (app.build === "extension" || app.build === "web") && app.environment.startsWith("test")
		});

		app.paths = this.getPaths(app);

		return app;
	};


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @returns {WpBuildPaths}
	 */
	getPaths = (app) =>
	{
		const paths = /** @type {WpBuildPaths} */({}),
			  wvBase = app.rc.vscode.webview.baseDir,
			  baseDir = resolve(__dirname, "..", ".."),
			  temp = resolve(process.env.TEMP || process.env.TMP  || "dist", app.rc.name, app.environment);
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
		return this.resolveRcPaths(baseDir, merge(paths, { ...this.rc.paths },
		{
			temp,
			build: baseDir,
			base: app.build !== "webview" ? baseDir : (wvBase ? resolve(baseDir, wvBase) :
													  join(baseDir, "src", "webview", "app"))
		}));
	};


	/**
	 * @function
	 * @private
	 * @param {string} baseDir
	 * @param {WpBuildPaths} paths
	 * @returns {WpBuildPaths}
	 */
	resolveRcPaths = (baseDir, paths) =>
	{
		Object.entries(paths).forEach((e) =>
		{
			if (isString(e[1], true))
			{
				if (!isAbsolute(e[1])) {
					paths[e[0]] = resolve(baseDir, e[1]);
				}
			}
			else {
				delete paths[e[0]];
			}
		});
		return paths;
	};


}


module.exports = WpBuildApp;

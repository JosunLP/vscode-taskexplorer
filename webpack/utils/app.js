/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { getMode } = require("../exports");
const { WebpackError } = require("webpack");
const { apply, isString } = require("./utils");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");
const { join, resolve, isAbsolute } = require("path");


/** @typedef {import("../utils").WpBuildRc} WpBuildRc */
/** @typedef {import("../types").Disposable} Disposable */
/** @typedef {import("../types").IDisposable} IDisposable */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("../types").WpBuildBuild} WpBuildBuild */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildRcBuild} WpBuildRcBuild */
/** @typedef {import("../types").WpBuildRcPaths} WpBuildRcPaths */
/** @typedef {import("../types").WebpackLogLevel} WebpackLogLevel */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildWebpackConfig} WpBuildWebpackConfig */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */
/** @typedef {import("../types").WpBuildGlobalEnvironment} WpBuildGlobalEnvironment */


/**
 * @class WpBuildApp
 * @implements {IDisposable}
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
     * @member {WpBuildBuild} build
     * @memberof WpBuildApp.prototype
     * @type {WpBuildBuild}
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
     * @member {WpBuildRc} rc
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
	 * @param {WpBuildRc} rc wpbuild rc configuration
	 * @param {any} globalEnv
	 * @param {WpBuildRcBuild} [build]
	 */
	constructor(argv, env, rc, globalEnv, build)
	{
		apply(this, this.wpApp(argv, env, rc, globalEnv, build));
	}

    dispose = () => {};


	/**
	 * @function
	 * @private
	 * @param {WebpackRuntimeArgs} argv Webpack command line argsmmand line args
	 * @param {WpBuildRuntimeEnvArgs} env Webpack build environment
	 * @param {WpBuildRc} rc wpbuild rc configuration
	 * @param {any} globalEnv
	 * @param {WpBuildRcBuild} [build]
	 * @returns {WpBuildApp}
	 * @throws {WebpackError}
	 */
	wpApp = (argv, env, rc, globalEnv, build) =>
	{
		const app = /** @type {WpBuildApp} */({});

		Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
		{   // environment "flags" should be set on the cmd line like `--env=property`, as opposed to `--env property=true`
			env[k] = env[k].toLowerCase() === "true"; // but convert any string values of `true` to a booleans just in case
		});

		apply(app,
		{
			...env,
			...build,
			argv,
			arge: env,
			global: globalEnv,
			wpc: {
				entry: {},
				mode: getMode(env, argv),
                module: {
                    rules: []
                },
				output: {},
                target: "node"
			}
		},
		{
			analyze: false,
			clean: false,
			disposables: [],
			esbuild: false,
			imageOpt: false,
			target: "node",
			verbosity: undefined
		});

        app.rc = rc;
		app.logger = new WpBuildConsoleLogger(app);
		globalEnv.verbose = !!app.verbosity && app.verbosity !== "none";

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
				app.logger.error("Could not detect build environment");
				throw new WebpackError(eMsg);
			}
		}


		apply(app, {
			isTests: app.environment.startsWith("test"),
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
		return apply(
            this.resolveRcPaths(baseDir, paths),
            this.resolveRcPaths(baseDir, app.rc.paths),
            this.resolveRcPaths(baseDir, {
                temp,
                build: baseDir,
                base: app.build !== "webview" ? baseDir : (wvBase ? resolve(baseDir, wvBase) :
                                                        join(baseDir, "src", "webview", "app"))
            })
        );
	};


	/**
	 * @function
	 * @private
	 * @template {WpBuildPaths} T
	 * @param {string} baseDir
	 * @param {T | Partial<T>} paths
	 * @returns {T}
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
		return /** @type {T} */(paths);
	};


}


module.exports = WpBuildApp;

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
const { resolve, isAbsolute } = require("path");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");

/** @typedef {import("../utils").WpBuildRc} WpBuildRc */
/** @typedef {import("../types").IDisposable} IDisposable */
/** @typedef {import("../types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildRcBuild} WpBuildRcBuild */
/** @typedef {import("../types").WpBuildRcPaths} WpBuildRcPaths */
/** @typedef {import("../types").WebpackLogLevel} WebpackLogLevel */
/** @typedef {import("../types").WpBuildWebpackMode} WpBuildWebpackMode */
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
     * @member {WpBuildRcBuild} build
     * @memberof WpBuildApp.prototype
     * @type {WpBuildRcBuild}
     */
    build;
    /**
     * @member {boolean} clean
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    clean;
    /**
     * @member {Array<IDisposable>} disposables
     * @memberof WpBuildApp.prototype
     * @type {Array<IDisposable>}
     */
    disposables;
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
     * @member {WpBuildWebpackMode} mode
     * @memberof WpBuildApp.prototype
     * @type {WpBuildWebpackMode}
     */
    mode;
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
	 * @param {WpBuildRcBuild} build
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
	 * @param {WpBuildRcBuild} build
	 * @returns {WpBuildApp}
	 * @throws {WebpackError}
	 */
	wpApp = (argv, env, rc, globalEnv, build) =>
	{
		const app = /** @type {WpBuildApp} */({}),
              mode = getMode(env, argv);

		Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
		{   // environment "flags" should be set on the cmd line like `--env=property`, as opposed to `--env property=true`
			env[k] = env[k].toLowerCase() === "true"; // but convert any string values of `true` to a booleans just in case
		});

        app.rc = rc;
        app.mode = mode;
		app.logger = new WpBuildConsoleLogger(app);
		globalEnv.verbose = !!app.verbosity && app.verbosity !== "none";

		apply(app,
		{
			...env,
			build,
			argv,
			arge: env,
			global: globalEnv,
            paths: this.getPaths(app),
			wpc: {
				entry: {},
				mode,
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

		if (!app.mode)
		{
			if (app.wpc.mode === "development" || argv.mode === "development") {
				app.mode = "development";
			}
			else if (app.wpc.mode === "production" || argv.mode === "production") {
				app.mode = "production";
			}
			else if (app.wpc.mode === "none" || argv.mode === "none") {
				app.mode = "test";
			}
			else {
				const eMsg = "Could not detect build environment";
				app.logger.error("Could not detect build environment");
				throw new WebpackError(eMsg);
			}
		}

		apply(app, {
			isTests: app.mode.startsWith("test"),
			isWeb: app.target.startsWith("web"),
			isMain: app.build.type === "module" || app.build.target === "web",
			isMainProd: (app.build.type === "module" || app.build.target === "web") && app.mode === "production",
			isMainTests: (app.build.type === "module" || app.build.target === "web") && app.mode.startsWith("test")
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
			  baseDir = resolve(__dirname, "..", ".."),
			  temp = resolve(process.env.TEMP || process.env.TMP  || "dist", app.rc.name, app.mode);
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
		return apply(
            this.resolveRcPaths(baseDir, paths),
            this.resolveRcPaths(baseDir, app.rc.paths),
            this.resolveRcPaths(baseDir, {
                temp,
                build: baseDir,
                base: baseDir
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

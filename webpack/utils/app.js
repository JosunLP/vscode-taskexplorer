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
const { apply, isString, WpBuildError, merge } = require("./utils");
const { resolve, isAbsolute } = require("path");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");

/** @typedef {import("../utils").WpBuildRc} WpBuildRc */
/** @typedef {import("../types").IDisposable} IDisposable */
/** @typedef {import("../types").WpBuildRcPathsExt} WpBuildRcPathsExt */
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
     * @member {WpBuildRcPathsExt} paths
     * @memberof WpBuildApp.prototype
     * @type {WpBuildRcPathsExt}
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
	 * @param {WpBuildRuntimeEnvArgs} arge Webpack build environment
	 * @param {WpBuildRc} rc wpbuild rc configuration
	 * @param {any} globalEnv
	 * @param {WpBuildRcBuild | string} build
	 */
	constructor(argv, arge, rc, globalEnv, build)
	{
        if (isString(build))
        {
            const thisBuild = rc.builds.find(b => b.name === "build");
            if (!thisBuild) {
                throw new WpBuildError(`Invalid build configuration - build name '${build}' not found`, "utils.app.js");
            }
            build = thisBuild;
        }
		apply(this, this.wpApp(argv, arge, rc, globalEnv, build));
	}

    dispose = () => {};


	/**
	 * @function
	 * @private
	 * @param {WebpackRuntimeArgs} argv Webpack command line argsmmand line args
	 * @param {WpBuildRuntimeEnvArgs} arge Webpack build environment
	 * @param {WpBuildRc} rc wpbuild rc configuration
	 * @param {any} globalEnv
	 * @param {WpBuildRcBuild} build
	 * @returns {WpBuildApp}
	 * @throws {WpBuildError}
	 */
	wpApp = (argv, arge, rc, globalEnv, build) =>
	{
		const app = /** @type {WpBuildApp} */({});

		Object.keys(arge).filter(k => typeof arge[k] === "string" && /(?:true|false)/i.test(arge[k])).forEach((k) =>
		{   // environment "flags" in arge should be set on the cmd line e.g. `--env=property`, as opposed to `--env property=true`
			arge[k] = arge[k].toLowerCase() === "true"; // but convert any string values of `true` to a booleans just in case
		});

        let target = build.target || "node",
            mode = app.mode || build.mode || getMode(arge, argv);
		if (!mode)
		{
			if (arge.mode === "development" || argv.mode === "development") {
				mode = "development";
			}
			else if (arge.mode === "production" || argv.mode === "production") {
				mode = "production";
			}
			else if (arge.mode === "none" || argv.mode === "none" || arge.mode?.startsWith("test")) {
				mode = arge.mode !== "testproduction" ? "test" : arge.mode ;
			}
		}

        if (!mode || !target) {
            throw new WpBuildError("Invalid build configuration - mode / target", "utils/app.js");
        }

        if ( mode === "test" || mode === "testproduction") {
            mode = "none";
        }

        app.rc = merge({}, rc);
		app.logger = new WpBuildConsoleLogger(app);
		globalEnv.verbose = !!app.verbosity && app.verbosity !== "none";

		apply(app,
		{
			...arge,
			...argv,
			arge,
			argv,
			build,
			global: globalEnv,
            isTests: mode.startsWith("test"),
			isWeb: target.startsWith("web"),
			isMain: build.type === "module" || target === "web",
			isMainProd: (build.type === "module" || target === "web") && mode === "production",
			isMainTests: (build.type === "module" || target === "web") && mode.startsWith("test"),
            mode,
            target,
			wpc: {
				entry: {},
				mode,
                module: {
                    rules: []
                },
				output: {},
                target
			}
		});

		app.paths = this.getPaths(app); // paths needs to be set "after" applying the properties above
		return app;
	};


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @returns {WpBuildRcPathsExt}
	 */
	getPaths = (app) =>
	{
		const paths = /** @type {WpBuildRcPathsExt} */({}),
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
	 * @template {WpBuildRcPathsExt} T
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

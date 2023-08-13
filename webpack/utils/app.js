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
const { resolve, isAbsolute } = require("path");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");
const { apply, isString, WpBuildError, merge, pick } = require("./utils");

/** @typedef {import("../utils").WpBuildRc} WpBuildRc */
/** @typedef {import("../types").IDisposable} IDisposable */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildRcBuild} WpBuildRcBuild */
/** @typedef {import("../types").WpBuildRcPaths} WpBuildRcPaths */
/** @typedef {import("../types").WebpackLogLevel} WebpackLogLevel */
/** @typedef {import("../types").WpBuildRcPathsExt} WpBuildRcPathsExt */
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
	 * @param {WpBuildGlobalEnvironment} globalEnv
	 * @param {WpBuildRcBuild | string} build
	 */
	constructor(argv, arge, rc, globalEnv, build)
	{
        this.disposables = [];
        if (isString(build))
        {
            const thisBuild = rc.builds.find(b => b.name === "build");
            if (!thisBuild) {
                throw new WpBuildError(`Invalid build configuration - build name '${build}' not found`, "utils.app.js");
            }
            build = thisBuild;
        }
		apply(this, this.wpApp(argv, arge, rc, globalEnv, build));
        this.disposables.push(
            this.logger,
            this
        );
	}

    dispose = () => this.logger.write(`dispose app wrapper instance for build '${this.build.name}'`, 3);


	/**
	 * @function
	 * @private
	 * @param {WebpackRuntimeArgs} argv Webpack command line argsmmand line args
	 * @param {WpBuildRuntimeEnvArgs} arge Webpack build environment
	 * @param {WpBuildRc} rc wpbuild rc configuration
	 * @param {WpBuildGlobalEnvironment} globalEnv
	 * @param {WpBuildRcBuild} build
	 * @returns {WpBuildApp}
	 * @throws {WpBuildError}
	 */
	wpApp = (argv, arge, rc, globalEnv, build) =>
	{
		const app = /** @type {WpBuildApp} */({});

        if (!rc.builds)
        {
            throw WpBuildError.getErrorProperty("builds", "utils/rc.js");
        }

		Object.keys(arge).filter(k => typeof arge[k] === "string" && /(?:true|false)/i.test(arge[k])).forEach((k) =>
		{   // environment "flags" in arge should be set on the cmd line e.g. `--env=property`, as opposed to `--env property=true`
			arge[k] = arge[k].toLowerCase() === "true"; // but convert any string values of `true` to a booleans just in case
		});

        let type = build.type,
            target = build.target,
            mode = build.mode || getMode(arge, argv);

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
            app.mode = build.mode = mode;
        }

        app.rc = merge({}, pick(rc, "name", "displayName", "detailedDisplayName", "publicInfoProject", "builds", "exports", "log", "paths", "plugins"));
    
        const modeRc = app.rc[mode];
        if (modeRc)
        {
            if (modeRc.log) {
                merge(app.rc.log, modeRc.log);
                delete modeRc.log;
            }
            if (modeRc.paths) {
                merge(app.rc.paths, modeRc.paths);
                delete modeRc.paths;
            }
            if (modeRc.exports) {
                merge(app.rc.exports, modeRc.exports);
                delete modeRc.exports;
            }
            if (modeRc.plugins) {
                merge(app.rc.plugins, modeRc.plugins);
                delete modeRc.plugins;
            }
            merge(rc, modeRc)
            type = build.type,
            target = build.target,
            mode = app.mode || build.mode || getMode(arge, argv);
        }

        if (!target)
        {
            target = "node"
            if ((/web(?:worker|app|view)/).test(build.name) || build.type === "webapp") {
                target = "webworker"
            }
            else if ((/web|browser/).test(build.name) || build.type === "webmodule") {
                target = "web"
            }
            else if ((/module|node/).test(build.name) || build.type === "module") {
                target = "node";
            }
            else if ((/tests?/).test(build.name) && mode.startsWith("test")) {
                target = "node";
            }
            else if ((/typ(?:es|ings)/).test(build.name)|| build.type === "types") {
                target = "node"
            }
            app.target = build.target = target;
        }

        if (!type)
        {
            if ((/web(?:worker|app|view)/).test(build.name)) {
                type = "webapp"
            }
            else if ((/web|browser/).test(build.name)) {
                type = "webmodule"
            }
            else if ((/tests?/).test(build.name)) {
                type = "tests";
            }
            else if ((/typ(?:es|ings)/).test(build.name)) {
                type = "types";
            }
            else if (target === "node") {
                type = "module"
            }
            build.type = type;
        }

        if (!mode || !target || !type) {
            mode = mode === "test" || mode === "testproduction" ? "none" : mode
            throw WpBuildError.getErrorProperty("mode / target / type", "utils/app.js", { mode });
        }

		apply(app,
		{   ...arge,
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
				mode: mode === "test" || mode === "testproduction" ? "none" : mode,
                module: {
                    rules: []
                },
				output: {},
                target
			}
		});

		globalEnv.verbose = !!app.verbosity && app.verbosity !== "none";
		app.logger = new WpBuildConsoleLogger(app);
		app.paths = this.getPaths(app);

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
	 * @param {boolean} [dotRelative]
     * @returns {string}
     */
    getDistPath = (dotRelative) =>
        ((dotRelative ? "./" : "") + (this.build.paths?.dist || this.paths.dist || "dist")).replace("././", "./");


    /**
	 * @function
	 * @param {boolean} [dotRelative]
     * @returns {string}
     */
    getSrcPath = (dotRelative) =>
        ((dotRelative ? "./" : "") + (this.build.paths?.src || this.paths.src || "src")).replace("././", "./");


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

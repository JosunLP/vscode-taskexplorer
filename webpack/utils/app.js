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
const typedefs = require("../types/typedefs");
const { resolve, isAbsolute } = require("path");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");
const { apply, isString, WpBuildError, merge, pick, isPromise } = require("./utils");


/**
 * @class WpBuildApp
 * @implements {typedefs.IDisposable}
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
     * @type {typedefs.WpBuildRuntimeEnvArgs}
     */
    arge;
    /**
     * @type {typedefs.WebpackRuntimeArgs}
     */
    argv;
    /**
     * @type {typedefs.WpBuildRcBuild}
     */
    build;
    /**
     * @member {boolean} clean
     * @memberof WpBuildApp.prototype
     * @type {boolean}
     */
    clean;
    /**
     * @type {Array<typedefs.IDisposable>}
     */
    disposables;
    /**
     * @type {boolean}
     */
    esbuild;
    /**
     * @type {boolean}
     */
    imageOpt;
    /**
     * @type {boolean}
     */
    isMain;
    /**
     * @type {boolean}
     */
    isMainProd;
    /**
     * @type {boolean}
     */
    isMainTests;
    /**
     * @type {boolean}
     */
    isTests;
    /**
     * @type {boolean}
     */
    isWeb;
    /**
     * @type {typedefs.WpBuildGlobalEnvironment}
     */
    global;
    /**
     * @type {WpBuildConsoleLogger}
     */
    logger;
    /**
     * @type {typedefs.WpBuildWebpackMode}
     */
    mode;
    /**
     * @type {typedefs.WpBuildRcPathsExt}
     */
    paths;
    /**
     * @type {typedefs.WpBuildRc}
     */
    rc;
    /**
     * @type {typedefs.WebpackTarget}
     */
    target;
    /**
     * @type {typedefs.WebpackLogLevel}
     */
    verbosity;
    /**
     * @type {typedefs.WpBuildWebpackConfig}
     */
    wpc;


	/**
	 * @class WpBuildApp
	 * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line argsmmand line args
	 * @param {typedefs.WpBuildRuntimeEnvArgs} arge Webpack build environment
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildGlobalEnvironment} globalEnv
	 * @param {typedefs.WpBuildRcBuild | string} build
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
	}


    /**
     * @function
     * @async
     */
    dispose = async () =>
    {
        for (const d of this.disposables.splice(0))
        {
            const result = d.dispose();
            if (isPromise(result)) {
                await result;
            }
        }
        this.logger.write(`dispose app wrapper instance for build '${this.build.name}'`, 3);
        this.logger.dispose();
    };


	/**
	 * @function
	 * @private
	 * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line argsmmand line args
	 * @param {typedefs.WpBuildRuntimeEnvArgs} arge Webpack build environment
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildGlobalEnvironment} globalEnv
	 * @param {typedefs.WpBuildRcBuild} build
	 * @returns {WpBuildApp}
	 * @throws {WpBuildError}
	 */
	wpApp = (argv, arge, rc, globalEnv, build) =>
	{
		const app = /** @type {WpBuildApp} */({});
		let type = build.type,
            target = build.target,
            mode = build.mode;

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

        if (!mode) {
            throw WpBuildError.getErrorProperty("mode", "utils/app.js", null);
        }
        if (!target) {
            throw WpBuildError.getErrorProperty("target", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(mode) });
        }
        if (!type) {
            throw WpBuildError.getErrorProperty("type", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(mode) });
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
	 * @returns {typedefs.WpBuildRcPathsExt}
	 */
	getPaths = (app) =>
	{
		const paths = /** @type {typedefs.WpBuildRcPathsExt} */({}),
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
	 * @template {typedefs.WpBuildRcPathsExt} T
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

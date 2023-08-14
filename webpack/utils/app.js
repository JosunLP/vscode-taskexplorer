/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { isAbsolute, relative, join } = require("path");
const resolvePath = require("path").resolve;
const typedefs = require("../types/typedefs");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");
const { apply, isString, WpBuildError, merge, isPromise, isArray, isObject } = require("./utils");
const {
	cache, devtool, entry, experiments, externals, ignorewarnings,
	minification, plugins, optimization, output, resolve, rules, stats, watch
} = require("../exports");
const { WpBuildWebpackModes } = require("./constants");


/**
 * @class WpBuildApp
 * @implements {typedefs.IDisposable}
 */
class WpBuildApp
{
    /**
     * @type {boolean}
     */
    analyze;
    /**
     * @type {typedefs.WpBuildRcBuild}
     */
    build;
    /**
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
     * @type {typedefs.WpBuildWebpackConfig}
     */
    wpc;


	/**
	 * @class WpBuildApp
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildRcBuild} build
	 */
	constructor(rc, build)
	{
        this.build = merge({}, build);
        this.applyRc(rc, build);
        if (!build.mode) {
            throw WpBuildError.getErrorProperty("mode", "utils/app.js", null);
        }
        if (!build.target) {
            throw WpBuildError.getErrorProperty("target", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(build.mode) });
        }
        if (!build.type) {
            throw WpBuildError.getErrorProperty("type", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(build.mode) });
        }
		this.applyApp(rc, build);
		this.applyPaths();
		this.logger = new WpBuildConsoleLogger(this);
        this.printBuildStart();
        this.buildWebpackConfig();
	}


    /**
     * @function
     * @static
     * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
     * @param {typedefs.WpBuildRcBuild} build
     * @returns {typedefs.WpBuildWebpackConfig}
     */
    static create = (rc, build) => new WpBuildApp(rc, build).wpc;


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
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildRcBuild} build
	 * @throws {WpBuildError}
	 */
	applyApp = (rc, build) =>
	{
        const mode = build.mode || rc.mode;
		apply(this,
		{   ...rc.args,
			// build,
            disposables: [],
			global: rc.global,
            isTests: rc.mode.startsWith("test"),
			isWeb: build.target.startsWith("web"),
			isMain: build.type === "module" || build.target === "web",
			isMainProd: (build.type === "module" || build.target === "web") && rc.mode === "production",
			isMainTests: (build.type === "module" || build.target === "web") && rc.mode.startsWith("test"),
            mode,
            target: build.target
		});
	};


	/**
	 * @function
	 * @private
	 */
	applyPaths = () =>
	{
		const paths = /** @type {typedefs.WpBuildRcPathsExt} */({}),
			  build = resolvePath(__dirname, "..", ".."),
			  temp = resolvePath(process.env.TEMP || process.env.TMP  || "dist", this.rc.name, this.mode);
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
		this.paths = apply(paths,
            this.resolveRcPaths(build, this.rc.paths),
            this.resolveRcPaths(build, {
                temp,
                build,
                base: this.rc.paths.src || build,
                dist: "dist",
                src: "src"
            })
        );
	};


	/**
	 * @function
	 * @private
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildRcBuild} build
	 */
    applyRc = (rc, build) =>
    {   //
        // Mereg/apply the current configured build properites into the main rc configs.
        // Build config objects can override base props in rc, e.g. `log`, `paths`, etc.
        // Note that any object property with an inner nested object as one of it's
        // props needs to use merge(), otherwise just use apply().  FOr first operation,
        // we merge() the base rrc into a new object, i.e. each 'WpBuildAPp' instance will
        // have a separate rc and will not erference the same rc object.
        //
		this.rc = merge({}, rc);
        if (isObject(build.log)) {
            merge(this.rc.log, build.log);
        }
        if (isObject(build.paths)) {
            merge(this.rc.paths, build.paths);
        }
        if (isObject(build.exports)) {
            merge(this.rc.exports, build.exports);
        }
        if (isObject(build.plugins)) {
            merge(this.rc.exports, build.plugins);
        }
        //
        // If mode specific build config is present, then merge/apply it's properties to the base
        // rc config props.
        //
        const modeRc = this.rc[this.rc.mode];
        if (modeRc)
        {
            if (isObject(modeRc.log)) {
                merge(this.rc.log, modeRc.log);
                merge(build.log, modeRc.log);
            }
            if (isObject(modeRc.paths)) {
                apply(this.rc.paths, modeRc.paths);
                apply(build.paths, modeRc.paths);
            }
            if (isObject(modeRc.exports)) {
                apply(this.rc.exports, modeRc.exports);
                apply(build.exports, modeRc.exports);
            }
            if (isObject(modeRc.plugins)) {
                apply(this.rc.plugins, modeRc.plugins);
                apply(build.plugins, modeRc.plugins);
            }
            if (isArray(modeRc.builds))
            {
                modeRc.builds.forEach((modeBuild) =>
                {
                    const baseBuild = this.rc.builds.find(base => base.name === modeBuild.name);
                    if (baseBuild) {
                        merge(baseBuild, modeBuild)
                    }
                    else {
                        this.rc.builds.push(merge({}, modeBuild))
                    }
                    if (build.name === modeBuild.name)
                    {
                        merge(build, modeBuild)
                    }
                });
            }
        }
        this.rc.mode = build.mode || this.rc.mode;
        WpBuildWebpackModes.forEach(m => delete this.rc[m]);
    };


    /**
     * Calls each ./exports/* default export to construct a {@link typedefs.WpBuildWebpackConfig webpack build configuration}
     *
     * @function
     * @private
     * @returns {typedefs.WpBuildWebpackConfig}
     */
    buildWebpackConfig = () =>
    {
        this.wpc = {
            context: this.paths.base,
            // context: this.paths.build,
            entry: {},
            mode: this.rc.mode === "test" || this.rc.mode === "testproduction" ? "none" : this.rc.mode,
            module: { rules: [] },
            name: `${this.rc.name}|${this.rc.pkgJson.version}|${this.build.name}|${this.mode}|${this.build.target}`,
            output: {},
            target: this.target
        };
        cache(this);          // Asset cache
        experiments(this);    // Set any experimental flags that will be used
        entry(this);          // Entry points for built output
        externals(this);      // External modules
        ignorewarnings(this); // Warnings from the compiler to ignore
        optimization(this);   // Build optimization
        minification(this);   // Minification / Terser plugin options
        output(this);         // Output specifications
        devtool(this);        // Dev tool / sourcemap control
        resolve(this);        // Resolve config
        rules(this);          // Loaders & build rules
        stats(this);          // Stats i.e. console output & webpack verbosity
        watch(this);          // Watch-mode options
        plugins(this);        // Plugins - exports.plugins() inits all plugin.plugins
        return this.wpc;
    };


    /**
     * @function
     * @param {boolean} [rel]
     * @param {boolean} [ctxRel]
     * @param {boolean} [dotRel]
     * @param {boolean} [psx]
     * @returns {string} string
     */
    getBasePath = (rel, ctxRel, dotRel, psx) => this.getPath(this.paths.base || this.build.paths?.src || process.cwd(), rel, dotRel, psx);


    /**
     * @function
     * @param {boolean} [rel]
     * @param {boolean} [ctxRel]
     * @param {boolean} [dotRel]
     * @param {boolean} [psx]
     * @returns {string} string
     */
    getBuildPath = (rel, ctxRel, dotRel, psx) => this.getPath(this.paths.build || process.cwd(), rel, dotRel, psx);


    /**
     * @function
     * @param {boolean} [rel]
     * @param {boolean} [ctxRel]
     * @param {boolean} [dotRel]
     * @param {boolean} [psx]
     * @returns {string} string
     */
    getDistPath = (rel, ctxRel, dotRel, psx) =>this.getPath(this.paths.dist || "dist", rel, dotRel, psx);


    /**
     * @function
     * @private
     * @param {string} path
     * @param {boolean} [rel]
     * @param {boolean} [ctxRel]
     * @param {boolean} [dotRel]
     * @param {boolean} [psx]
     * @returns {string} string
     */
    getPath = (path, rel, ctxRel, dotRel, psx) =>
    {
        const basePath = this.paths.build || process.cwd();
        if (rel !== false)
        {
            path = ((dotRel !== false ? "./" : "") + (isAbsolute(path) ? relative(basePath, path) : path)).replace("././", "./");
        }
        else if (!isAbsolute(path)) {
            path = resolvePath(basePath, path);
        }
        if (ctxRel !== false) {
            path = path.replace(/\\/g, "/")
        }
        if (psx !== false) {
            path = path.replace(/\\/g, "/")
        }
        return path;
    };


    /**
     * @function
     * @param {boolean} [rel]
     * @param {boolean} [ctxRel]
     * @param {boolean} [dotRel]
     * @param {boolean} [psx]
     * @returns {string} string
     */
    getSrcPath = (rel, ctxRel, dotRel, psx) => this.getPath(this.paths.src, rel, dotRel, psx);


    /**
     * @function
     * @private
     */
    printBuildStart = () =>
    {
        const l = this.logger;
        this.global.buildCount = this.global.buildCount || 0;
        l.value(
            `Start Webpack build ${++this.global.buildCount}`,
            l.tag(this.build.name, l.colors.cyan, l.colors.white) + " " + l.tag(this.target, l.colors.cyan, l.colors.white),
            undefined, undefined, l.icons.color.start, l.colors.white
        );
    };


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
					paths[e[0]] = resolvePath(baseDir, e[1]);
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

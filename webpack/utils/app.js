/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const gradient = require("gradient-string");
const resolvePath = require("path").resolve;
const typedefs = require("../types/typedefs");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");
const { WpBuildWebpackModes } = require("./constants");
const { isAbsolute, relative, posix, normalize } = require("path");
const { apply, isString, WpBuildError, merge, isPromise, isArray, isObject } = require("./utils");
const {
	cache, devtool, entry, experiments, externals, ignorewarnings, minification, plugins, optimization,
    output, resolve, rules, stats, watch
} = require("../exports");


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
     * @type {typedefs.WpBuildRc}
     */
    rcInst;
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
        this.rcInst = rc;
        this.build = merge({}, build);
        this.applyRc(rc, this.build);
        if (!this.build.mode) {
            throw WpBuildError.getErrorProperty("mode", "utils/app.js", null);
        }
        if (!this.build.target) {
            throw WpBuildError.getErrorProperty("target", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(this.build.mode) });
        }
        if (!this.build.type) {
            throw WpBuildError.getErrorProperty("type", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(this.build.mode) });
        }
		this.applyApp();
		this.applyPaths();
		this.logger = new WpBuildConsoleLogger(this);
        this.printBuildStart();
        this.buildWebpackConfig();
        this.printBuildProperties();
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
	 */
	applyApp = () =>
	{
        const b = this.build,
              mode = b.mode || this.rc.mode;
		apply(this,
		{   ...this.rc.args,
            disposables: [],
			global: this.rc.global,
            isTests: this.rc.name === "tests" || b.type === "tests" || this.rc.mode.startsWith("test"),
			isWeb: b.type === "webmodule" || b.type === "webapp" || b.target.startsWith("web"),
			isMain: b.type === "module" || b.target === "web" || b.name === "main" || b.name === "module",
			isMainProd: (b.type === "module" || b.target === "web" || b.name === "main" || b.name === "module") && this.rc.mode === "production",
			isMainTests: (b.type === "module" || b.target === "web" || b.name === "main" || b.name === "module") && this.rc.mode.startsWith("test"),
            mode,
            target: b.target
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
                base: this.rc.paths.ctx || this.rc.paths.src || build,
                ctx: this.rc.paths.ctx || build,
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
    {
        /**
         * @param {typedefs.WpBuildRcEnvironmentBase} rcChild
         * @param {boolean} [isModeRc]
         */
        const _applyOverrides = (rcChild, isModeRc) =>
        {
            if (isObject(rcChild.log))
            {
                if (rc.log.color) {
                    this.rc.log.colors.valueStar = rc.log.color;
                    this.rc.log.colors.buildBracket = rc.log.color;
                    this.rc.log.colors.tagBracket = rc.log.color;
                    this.rc.log.colors.infoIcon = rc.log.color;
                }
                merge(this.rc.log, rcChild.log);
                if (isModeRc) {
                    merge(build.log, modeRc.log);
                }
            }
            if (isObject(rcChild.paths)) {
                apply(this.rc.paths, rcChild.paths);
                if (isModeRc) {
                    apply(build.paths, modeRc.paths);
                }
            }
            if (isObject(rcChild.exports)) {
                apply(this.rc.exports, rcChild.exports);
                if (isModeRc) {
                    apply(build.exports, modeRc.exports);
                }
            }
            if (isObject(rcChild.plugins)) {
                apply(this.rc.plugins, rcChild.plugins);
                if (isModeRc) {
                    apply(build.plugins, modeRc.plugins);
                }
            }
        };
		this.rc = merge({}, rc);
        //
        // Mereg/apply the current configured build properites into the main rc configs.
        // Build config objects can override base props in rc, e.g. `log`, `paths`, etc.
        // Note that any object property with an inner nested object as one of it's
        // props needs to use merge(), otherwise just use apply().  FOr first operation,
        // we merge() the base rrc into a new object, i.e. each 'WpBuildAPp' instance will
        // have a separate rc and will not erference the same rc object.
        //
		_applyOverrides(build);
        //
        // If mode specific build config is present, then merge/apply it's properties to the base
        // rc config props.
        //
        const modeRc = this.rc[this.rc.mode];
        if (modeRc)
        {
		    _applyOverrides(modeRc, true);
            if (isArray(modeRc.builds))
            {
                modeRc.builds.forEach((modeBuild) =>
                {
                    const baseBuild = this.rc.builds.find(base => base.name === modeBuild.name);
                    if (baseBuild) {
                        merge(baseBuild, modeBuild)
                    }
                    else {
                        this.rc.builds.push(merge({}, modeBuild));
                    }
                    if (build.name === modeBuild.name)
                    {
                        merge(build, modeBuild)
                    }
                    _applyOverrides(modeBuild);
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
            context: this.paths.ctx,
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
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     * @returns {string} string
     */
    getBuildPath = (options) => this.getPath(this.paths.build, options);


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     * @returns {string} string
     */
    getContextPath = (options) => this.getPath(this.paths.base, options);


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     * @returns {string} string
     */
    getDistPath = (options) =>this.getPath(this.paths.dist, options);


    /**
     * @function
     * @private
     * @param {string} path
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     * @returns {string} string
     */
    getPath = (path, options) =>
    {
        const opts = apply({ rel: false, ctx: false, dot: false , psx: false }, options),
              basePath = opts.ctx ? this.paths.base : this.paths.build;
        if (opts.rel)
        {
            path = ((opts.dot ? "./" : "") + (isAbsolute(path) ? relative(basePath, path) : path)).replace("././", "./");
        }
        else if (!isAbsolute(path))
        {
            path = resolvePath(basePath, path);
        }
        path = !(/^\.[\\\/]$/).test(path) ? path : ".";
        return path ? !opts.psx ? normalize(path) : posix.normalize(path) : ".";
    };


    getRcPath = () =>
    {

    };


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     * @returns {string} string
     */
    getSrcPath = (options) => this.getPath(this.paths.src, options);


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
        // l.write("   Mode  : " + l.withColor(), 1, "", 0, l.colors.white);
    };


   /**
    * @function
    * @private
    * @member logEnvironment
    */
    printBuildProperties = () =>
    {
        const l = this.logger,
              wpc = this.wpc;

        l.sep();
        l.write("Global Configuration:", 1, "", 0, l.colors.white);
        Object.keys(this.global).filter(k => typeof this.global[k] !== "object").forEach(
            (k) => l.value(`   ${k}`, this.global[k], 1)
        );
        l.sep();
        l.write("Webpack Configuration:", 1, "", 0, l.colors.white);
        l.value("   mode", wpc.mode, 1);
        l.value("   target", wpc.target, 1);
        l.value("   context directory", wpc.context, 1);
        l.value("   output directory", wpc.output.path, 1);
        l.sep();
        l.write("Rc Configuration:", 2, "", 0, l.colors.white);
        l.value("   mode", this.rc.mode, 2);
        l.value("   base build directory", this.getBuildPath(), 2);
        l.value("   context directory", this.getContextPath({ rel: true }), 2);
        l.value("   distribution directory", this.getDistPath({ rel: true }), 2);
        l.value("   source directory", this.getSrcPath({ rel: true }), 2);
        l.value("   tsconfig path", this.paths.tsconfig, 2);
        l.sep();
        l.write("Merged Rc JSON:", 3, "", 0, l.colors.white);
        l.value("   log configuration", JSON.stringify(this.rc.log), 3);
        l.value("   paths configuration", JSON.stringify(this.rc.paths), 3);
        l.value("   exports configuration", JSON.stringify(this.rc.exports), 3);
        l.value("   plugins configuration", JSON.stringify(this.rc.plugins), 3);
        l.sep();
        // l.write("   Mode  : " + l.withColor(), 1, "", 0, l.colors.white);
        // l.write("   Argv  : " + l.withColor(), 1, "", 0, l.colors.white);
        // l.write("   Env   : " + l .withColor(), 1, "", 0, l.colors.white);
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

/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const resolvePath = require("path").resolve;
const typedefs = require("../types/typedefs");
const { existsSync, mkdirSync } = require("fs");
const WpBuildConsoleLogger = require("./console");
const { isWpBuildRcPathsProp } = require("./constants");
const { isAbsolute, relative, posix, normalize, join, sep } = require("path");
const {
    apply, isString, WpBuildError, merge, isPromise, isObject, capitalize, findTsConfig, getTsConfig
} = require("./utils");
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
     * @type {typedefs.WpBuildRcPaths}
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
     * @type {typedefs.WpBuildRcSourceCodeType}
     */
    source;
    /**
     * @type {typedefs.WebpackTarget}
     */
    target;
    /**
     * @type {typedefs.WpBuildAppTsConfig | undefined}
     */
    tsConfig;
    /**
     * @type {typedefs.WpBuildWebpackConfig}
     */
    wpc;


	/**
	 * @class WpBuildApp
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildRcBuild | string} build
	 */
	constructor(rc, build)
	{
        this.rcInst = rc;
		this.rc = merge({}, rc);
		this.build = merge({}, !isString(build) ? build : (rc.builds.find(b => b.name === build)));
        if (isString(build)) {
            this.build.name = build;
        }
        this.applyRc();
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
        if (this.paths.tsconfig) {
            this.tsConfig = getTsConfig(this);
        }
        this.initLogger(this.rc.log);
        this.buildWebpackConfig();
        this.printBuildProperties();
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
		const paths = /** @type {typedefs.WpBuildRcPaths} */({}),
			  base = resolvePath(__dirname, "..", ".."),
			  temp = resolvePath(process.env.TEMP || process.env.TMP  || "dist", this.rc.name, this.mode);
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
		this.paths = apply(paths,
            this.resolveRcPaths(base, this.rc.paths),
            this.resolveRcPaths(base, {
                temp,
                base,
                ctx: this.rc.paths.ctx || base,
                dist: "dist",
                src: "src"
            })
        );
        if (!this.paths.tsconfig) {
            this.paths.tsconfig = this.build.paths.tsconfig = this.rc.paths.tsconfig = findTsConfig(this);
        }
	};


	/**
	 * @function
	 * @private
	 */
    applyRc = () =>
    {
        apply(this.build, this.rc.builds.find(b => b.name === this.build.name));
        this.validateRc(this.build);
        this.validateRc(this.rc);
        if (isObject(this.build.log))
        {
            merge(this.rc.log, this.build.log);
            if (this.build.log.color) {
                this.rc.log.colors.valueStar = this.build.log.color;
                this.rc.log.colors.buildBracket = this.build.log.color;
                this.rc.log.colors.tagBracket = this.build.log.color;
                this.rc.log.colors.infoIcon = this.build.log.color;
            }
        }
        if (isObject(this.build.paths)) {
            apply(this.rc.paths, this.build.paths);
        }
        if (isObject(this.build.exports)) {
            apply(this.rc.exports, this.build.exports);
        }
        if (isObject(this.build.plugins)) {
            apply(this.rc.plugins, this.build.plugins);
        }
        if (isObject(this.build.alias)) {
            apply(this.rc.alias, this.build.alias);
        }
        this.mode = this.rc.mode = this.build.mode || this.rc.mode;
    };


    validateRc = (rc) =>
    {
        if (!rc.log) {
            rc.log = {};
        }
        if (!rc.log.colors) {
            rc.log.colors = { default: "grey" };
        }
        else if (!rc.log.colors.default) {
            rc.log.colors.default = "grey";
        }
        if (!rc.builds) {
            rc.builds = [];
        }
        if (!rc.paths) {
            rc.paths = {};
        }
        if (!rc.alias) {
            rc.alias = {};
        }
    };


    buildEnvHasTests = () =>
    {
        return !!this.rc.builds.find(b => b.name === "tests" || b.type === "tests") ||
               !!this.rcInst.builds.find(b => b.name === "tests" || b.type === "tests") ||
               !!this.rcInst[this.mode]?.builds.find(b => b.name === "tests" || b.type === "tests");
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
     * @param {"src" | "dist"} type
     * @returns {typedefs.WpBuildRcPathsKey}
     */
    getBuildPathKey = (type) => {
        return /** @type {typedefs.WpBuildRcPathsKey} */(`${type}${capitalize(this.build.type)}`);
    };


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     */
    getContextPath = (options) => this.getRcPath("ctx", options);


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     */
    getDistPath = (options) =>
    {
        const opts = { stat: true, ...options };
        return this.getRcPath(this.getBuildPathKey("dist"), opts) ||
               this.getRcPath("dist", opts) || join(this.paths.base, "dist");
    };


    /**
     * @function
     * @param {typedefs.WpBuildRcPathsKey} pathKey
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     */
    getRcPath = (pathKey, options) =>
    {
        let path = "";
        const opts = options || {},
              basePath = (opts.ctx ? this.paths.ctx : this.paths.base) || process.cwd();
        if (opts.path || isWpBuildRcPathsProp(pathKey))
        {
            path = (!opts.path ? this.rc.paths[pathKey] : opts.path) || "";
            if (!opts.stat || (path && (!opts.fstat || existsSync(path))))
            {
                if (opts.rel)
                {
                    path = isAbsolute(path) ? relative(basePath, path) : path;
                }
                else if (!isAbsolute(path))
                {
                    path = resolvePath(basePath, path);
                }
            }
        }
        path = path ? (!opts.psx ? normalize(path) : posix.normalize(path)) : "";
        if (opts.rel && opts.dot && ! (/^\.[\\\/]/).test(path) && (path || !opts.stat))
        {
            path = "." + (opts.psx ? "/" : sep) + path;
        }
        return path;
    };


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     */
    getSrcPath = (options) =>
    {
        const opts = { stat: true, ...options };
        return this.getRcPath(this.getBuildPathKey("src"), opts) ||
               this.getRcPath("src", opts) || join(this.paths.base, "src");
    };


    /**
     * @function
     * @returns {typedefs.WpBuildWebpackAliasConfig}
     */
    getAliasConfig = () => this.build.alias || {};


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     */
    getSrcEnvPath = (options) =>
    {
        const opts = { stat: true, ...options };
        let path = this.getRcPath("srcEnv", opts);
        if (!path)
        {
            path = join(this.getRcPath("src"), "lib", "env");
            if (!existsSync(path))
            {
                path = join(this.getRcPath("src"), "env");
                if (!existsSync(path))
                {
                    path = this.getRcPath("src", opts);
                }
                else {
                    path = this.getRcPath("srcEnv", { path, ...opts });
                }
            }
            else {
                path = this.getRcPath("srcEnv", { path, ...opts });
            }
        }
        return path;
    };


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     */
    getSrcTestsPath = (options) =>
    {
        let path = "";
        const opts = { stat: true, ...options };
        if (this.build.name !== "tests" || this.build.type !== "tests")
        {
            const build = this.rc.builds.find(b => b.type === "tests" || b.name.toLowerCase() === "tests");
            if (build && build.paths.src)
            {
                path = this.getRcPath("src", { path: this.resolveRcPath(this.paths.base, build.paths.src), ...opts });
            }
        }
        path = path || this.getRcPath(
            "srcTests", opts) || this.getRcPath("src", opts) || join(this.paths.base, "src", "tests"
        );
        return path;
    };


    /**
     * @function
     * @param {typedefs.WpBuildAppGetPathOptions} [options]
     */
    getSrcTypesPath = (options) =>
    {
        const opts = { fstat: true, ...options };
        let path = this.getRcPath("srcTypes", opts);
        if (!path)
        {
            path = join(this.paths.base, "types");
            if (!existsSync(path))
            {
                path = join(this.getRcPath("src", opts), "types");
                if (!existsSync(path))
                {
                    path = "";
                }
            }
        }
        return path;
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildRcLog} options
     */
    initLogger = (options) =>
    {
        const l = this.logger = new WpBuildConsoleLogger({
            envTag1: this.build.name , envTag2: this.target.toString(), ...options
        });
        const c = l.colors;
        this.global.buildCount = this.global.buildCount || 0;
        l.value(
            `Start Webpack build ${++this.global.buildCount}`,
            l.tag(this.build.name, c.cyan, c.white) + " " + l.tag(this.target, c.cyan, c.white),
            undefined, undefined, l.icons.color.start, c.white
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
        l.value("   entry", JSON.stringify(this.wpc.entry), 3);
        l.value("   resolve", JSON.stringify(this.wpc.resolve), 3);
        l.value("   output", JSON.stringify(this.wpc.output), 4);
        l.value("   rules", JSON.stringify(this.wpc.module.rules), 4);
        l.sep();
        l.write("Build Configuration:", 2, "", 0, l.colors.white);
        l.value("   name", this.build.name, 2);
        l.value("   type", this.build.type, 2);
        l.value("   target", this.build.target, 2);
        l.sep();
        l.write("Rc Configuration:", 2, "", 0, l.colors.white);
        l.value("   name", this.build.name, 2);
        l.value("   mode", this.rc.mode, 2);
        l.value("   base/project directory", this.getRcPath("base"), 2);
        l.value("   context directory", this.getRcPath("ctx", { rel: true }), 2);
        l.value("   distribution directory", this.getDistPath({ rel: true }), 2);
        l.value("   distribution tests directory", this.getRcPath("distTests", { rel: true }), 2);
        l.value("   source directory", this.getSrcPath({ rel: true }), 2);
        l.value("   source module (nodejs) directory", this.getRcPath("srcModule",  { rel: true }), 2);
        l.value("   source env directory", this.getRcPath("srcEnv",  { rel: true }), 2);
        l.value("   source tests directory", this.getRcPath("srcTests",  { rel: true }), 2);
        l.value("   source types directory", this.getSrcTypesPath({ rel: true }), 2);
        l.value("   source web apps directory", this.getRcPath("srcWebApp",  { rel: true }), 2);
        l.value("   source module (web) directory", this.getRcPath("srcWebModule",  { rel: true }), 2);
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
	 * @param {string} baseDir
	 * @param {string | undefined} path
	 * @returns {string | undefined}
	 */
    resolveRcPath = (baseDir, path) =>
	{
        if (isString(path, true))
        {
            if (!isAbsolute(path)) {
                path = resolvePath(baseDir, path);
            }
        }
		return path;
	};


	/**
	 * @function
	 * @private
	 * @param {string} baseDir
	 * @param {typedefs.WpBuildRcPaths | Partial<typedefs.WpBuildRcPaths>} paths
	 * @returns {typedefs.WpBuildRcPaths}
	 */
	resolveRcPaths = (baseDir, paths) =>
	{
		Object.entries(paths).forEach((e) =>
		{
			paths[e[0]] = this.resolveRcPath(baseDir, e[1]);
			if (!paths[e[0]]) {
				delete paths[e[0]];
			}
		});
		return /** @type {typedefs.WpBuildRcPaths} */(paths);
	};

}


module.exports = WpBuildApp;

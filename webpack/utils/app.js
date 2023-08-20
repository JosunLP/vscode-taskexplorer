/* eslint-disable jsdoc/valid-types */
/* eslint-disable jsdoc/no-undefined-types */
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
const { isAbsolute, relative, posix, normalize, sep, dirname } = require("path");
const {
    apply, isString, WpBuildError, merge, isPromise, isObject, capitalize, findTsConfig, getTsConfig, isArray
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
     * @type {typedefs.WpBuildCombinedRuntimeArgs}
     */
    args;
    /**
     * @type {typedefs.WpBuildRcBuild}
     */
    build;
    /**
     * @type {Array<typedefs.IDisposable>}
     */
    disposables;
    /**
     * @type {WpBuildError[]}
     */
    errors;
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
     * @type {typedefs.WpBuildRcPackageJson}
     */
    pkgJson;
    /**
     * @type {typedefs.WpBuildRc}
     */
    rc;
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
     * @type {typedefs.WpBuildRcVsCode}
     */
    vscode;


	/**
	 * @class WpBuildApp
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildRcBuild} build
	 */
	constructor(rc, build)
	{
        if (!build.mode) {
            throw WpBuildError.getErrorProperty("mode", "utils/app.js", null);
        }
        if (!build.target) {
            throw WpBuildError.getErrorProperty("target", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(build.mode) });
        }
        if (!build.type) {
            throw WpBuildError.getErrorProperty("type", "utils/app.js", { mode: /** @type {typedefs.WebpackMode} */(build.mode) });
        }

        this.rc = rc;
        this.build = build;
        this.errors = [];
        this.disposables = [];

		this.applyAppRc();
        if (this.build.paths.tsconfig) {
            this.tsConfig = getTsConfig(this.build);
        }

        this.initLogger(/** @type {typedefs.TypeWpBuildRcLog} */(this.build.log));
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
	applyAppRc = () =>
	{
        const b = this.build;
		apply(this,
		{
            args: this.rc.args,
			global: this.rc.global,
            isTests: b.name === "tests" || b.type === "tests" ||b. mode.startsWith("test"),
			isWeb: b.type === "webmodule" || b.type === "webapp" || b.target.startsWith("web"),
			isMain: b.type === "module" || b.target === "web" || b.name === "main" || b.name === "module",
			isMainProd: (b.type === "module" || b.target === "web" || b.name === "main" || b.name === "module") && b.mode === "production",
			isMainTests: (b.type === "module" || b.target === "web" || b.name === "main" || b.name === "module") && b.mode === "test",
            mode: b.mode || this.rc.mode,
            paths: b.paths,
            pkgJson: this.rc.pkgJson,
            target: b.target,
            source: b.source || this.rc.source,
            vscode: this.rc.vscode
		});
	};


	// /**
	//  * @function
	//  * @private
	//  * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	//  * @param {typedefs.WpBuildRcBuild | string} build
	//  */
    // applyRc = (rc, build) =>
    // {
    //     this.rc = rc; // rc.getBuildRc(build);
	// 	this.build = merge({}, !isString(build) ? build : (this.rc.builds.find(b => b.name === build)));
    //     this.rc = rc; // rc.getBuildRc(build);
    // };


    // /**
    //  * @private
    //  * @param {typedefs.WpBuildRcBuild | string} build
    //  * @returns {typedefs.WpBuildRcEnvironmentBase}
    //  */
    // applyBuildRc = (build) =>
    // {
    //     const rc = {
    //         alias: merge({}, this.alias),
    //         // builds: this.builds.map(b => merge({}, b)),
    //         exports: merge({}, this.exports),
    //         log: merge({}, this.log),
    //         paths: merge({}, this.paths),
    //         plugins: merge({}, this.plugins)
    //     };
	// 	if (isString(build)) {
    //         build = apply({}, this.builds.find(b => b.name === build));
    //     }
    //     if (isObject(build.log))
    //     {
    //         merge(rc.log, build.log);
    //         if (build.log.color) {
    //             rc.log.colors.valueStar = build.log.color;
    //             rc.log.colors.buildBracket = build.log.color;
    //             rc.log.colors.tagBracket = build.log.color;
    //             rc.log.colors.infoIcon = build.log.color;
    //         }
    //     }
    //     if (isObject(build.paths)) {
    //         apply(rc.paths, build.paths);
    //     }
    //     if (isObject(build.exports)) {
    //         apply(rc.exports, build.exports);
    //     }
    //     if (isObject(build.plugins)) {
    //         apply(rc.plugins, build.plugins);
    //     }
    //     if (isObject(build.alias)) {
    //         apply(rc.alias, build.alias);
    //     }
    //     build.mode = build.mode || this.mode;
    //     return rc;
    // };


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
            context: this.build.paths.ctx || this.build.paths.base,
            entry: {},
            mode: this.rc.mode === "test" ? "none" : this.rc.mode,
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
     * @returns {typedefs.WpBuildWebpackAliasConfig}
     */
    getAliasConfig = () =>
    {
        const alias = this.build.alias || {},
              tsConfig = this.tsConfig;

        if (tsConfig && tsConfig.json.compilerOptions?.paths)
        {
            const _map = (e) => e.map ((e) => [ e[0].replace(/[\\\/]\*{0,1}$/g, "") , e[1].map(e => e.replace(/[\\\/]\*{0,1}$/g, "")) ]);
            _map(Object.entries(tsConfig.json.compilerOptions.paths)).forEach(([ key, paths ]) =>
            {
                if (isArray(paths))
                {
                    const v = alias[key];
                    paths.forEach((p) =>
                    {
                        if (!isAbsolute(p)) {
                            p = resolvePath(dirname(tsConfig.path), p);
                        }
                        if (isArray(v))
                        {
                            if (v.includes(p)) {
                                this.logger.warning("tsconfig alias extractions share same key/value");
                            }
                            else {
                                v.push(p);
                            }
                        }
                        else {
                            alias[key] = [ p ];
                        }
                    });
                }
            });
        }

        return alias || {};
    }


    /**
     * @function
     * @param {string} name
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getApp = (name) => this.rc.apps.find(a => a.build.type === name || a.build.name === name);


    /**
     * @function
     * @param {string} name
     * @returns {typedefs.WpBuildRcBuild | undefined}
     */
    getAppBuild = (name) => this.rc.apps.find(a => a.build.type === name || a.build.name === name)?.build;


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getBasePath = (options) => (!options || !options.ctx ? this.getRcPath("base", options) : this.getRcPath("ctx", options));


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getContextPath = (options) => this.getRcPath("ctx", options);


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getDistPath = (options) => /** @type {R} */(this.getRcPath("dist", options));


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {typedefs.WpBuildRcPathsKey} pathKey
     * @param {P} [options]
     * @returns {R}
     */
    getRcPath = (pathKey, options) =>
    {
        let path;
        const opts = /** @type {typedefs.WpBuildAppGetPathOptions} */(apply({}, options)),
              basePath = (opts.ctx ? this.build.paths.ctx : this.build.paths.base) || process.cwd();

        const _getPath = /** @param {string | undefined} path */(path) =>
        {
            if (path)
            {
                if (opts.rel)
                {
                    if (isAbsolute(path))
                    {
                        if (opts.stat && !existsSync(path)) {
                            path = undefined;
                        }
                        else {
                            path = relative(basePath, path);
                        }
                    }
                    else
                    {
                        if (opts.stat && !existsSync(resolvePath(basePath, path))) {
                            path = undefined;
                        }
                        else if (opts.dot && !(/^\.[\\\/]/).test(path)) {
                            path = "." + (opts.psx ? "/" : sep) + path;
                        }
                    }
                }
                else
                {
                    if (!isAbsolute(path)) {
                        path = resolvePath(basePath, path);
                    }
                    if (opts.stat && !existsSync(resolvePath(basePath, path))) {
                        path = undefined;
                    }
                }

                return path ? (!opts.psx ? normalize(path) : posix.normalize(path)) : undefined;
            }
        };

        const buildName = opts.build || this.build.name,
              build = this.rc.builds.find(b => b.name === buildName || b.type === buildName);
        if (build) {
            path = _getPath(build.paths[pathKey]);
        }

        return /** @type {R} */(path || _getPath(this.rc.paths[pathKey]) || _getPath(basePath));
    };


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getSrcPath = (options) => this.getRcPath("src", options);
    // /**
    //  * @function
    //  * @param {typedefs.WpBuildAppGetPathOptions & { stat: true }} options
    //  * @returns {string | undefined}
    //  */
    // getSrcPath(options)
    // /**
    //  * @function
    //  * @param {typedefs.WpBuildAppGetPathOptions & { stat: false }} options
    //  * @returns {string}
    //  */
    // getSrcPath(options)
    // /**
    //  * @function
    //  * @param {typedefs.WpBuildAppGetPathOptions} [options]
    //  * @returns {string}
    //  */
    // getSrcPath(options)
    // /**
    //  * @function
    //  * @returns {string}
    //  */
    // getSrcPath()
    // /**
    //  * @function
    //  * @param {typedefs.WpBuildAppGetPathOptions} [options]
    //  * @returns {string}
    //  */
    // getSrcPath(options) { return /** @type {string} */(this.getRcPath("src", options)); }


    hasTests = () => !!this.rc.builds.find(b => b.type === "tests" || b.name.toLowerCase().startsWith("test"));


    hasTypes = () => !!this.rc.builds.find(b => b.type === "types" || b.name.toLowerCase().startsWith("type"));


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
        l.write("Rc Configuration:", 2, "", 0, l.colors.white);
        l.value("   name", this.rc.name, 2);
        l.value("   mode", this.rc.mode, 2);
        l.value("   version", this.rc.pkgJson.version, 2);
        l.sep();
        l.write("Build Configuration:", 3, "", 0, l.colors.white);
        l.value("   name", this.build.name, 2);
        l.value("   type", this.build.type, 2);
        l.value("   target", this.build.target, 2);
        l.value("   alias configuration", JSON.stringify(this.build.alias), 3);
        l.value("   log configuration", JSON.stringify(this.build.log), 3);
        l.value("   exports configuration", JSON.stringify(this.build.exports), 3);
        l.value("   paths configuration", JSON.stringify(this.build.paths), 3);
        l.value("   plugins configuration", JSON.stringify(this.build.plugins), 3);
        l.sep();
        l.write("Build Paths Configuration:", 3, "", 0, l.colors.white);
        l.value("   base/project directory", this.getRcPath("base"), 2);
        l.value("   context directory", this.getRcPath("ctx", { rel: true }), 2);
        l.value("   distribution directory", this.getDistPath({ rel: true }), 2);
        l.value("   distribution tests directory", this.getDistPath({ rel: true, build: "tests" }), 2);
        l.value("   distribution types directory", this.getDistPath({ rel: true, build: "types" }), 2);
        l.value("   source directory", this.getSrcPath({ rel: true }), 2);
        l.value("   source tests directory", this.getSrcPath({ rel: true, build: "tests" }), 2);
        l.value("   source types directory", this.getSrcPath({ rel: true, build: "types" }), 2);
        l.value("   tsconfig path", this.build.paths.tsconfig, 2);
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
        // l.write("   Mode  : " + l.withColor(), 1, "", 0, l.colors.white);
        // l.write("   Argv  : " + l.withColor(), 1, "", 0, l.colors.white);
        // l.write("   Env   : " + l .withColor(), 1, "", 0, l.colors.white);
    };
}


module.exports = WpBuildApp;

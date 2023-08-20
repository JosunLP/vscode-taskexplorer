/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const JSON5 = require("json5");
const WpBuildApp = require("./app");
const { readFileSync, mkdirSync, existsSync } = require("fs");
const { globalEnv } = require("./global");
const typedefs = require("../types/typedefs");
const WpBuildConsoleLogger = require("./console");
const { resolve, basename, join, dirname, isAbsolute, sep } = require("path");
const { WpBuildError, apply, pick, isString, merge, isObject, isArray, pickNot, mergeIf, applyIf, findTsConfig } = require("./utils");
const {
    isWpBuildRcBuildType, isWpBuildWebpackMode, isWebpackTarget, WpBuildWebpackModes
} = require("./constants");


/**
 * @type {(keyof typedefs.WpBuildRcPackageJson)[]}
 */
const WpBuildRcPackageJsonProps = [ "author", "description", "displayName", "main", "module", "name", "publisher", "version" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.IWpBuildAppSchema}
 */
const isWpBuildRcPackageJsonProp = (v) => !!v && WpBuildRcPackageJsonProps.includes(v);


/**
 * @class
 * @implements {typedefs.IWpBuildRcSchema}
 */
class WpBuildRc
{
    /**
     * @type {typedefs.WpBuildWebpackAliasConfig}
     */
    alias;
    /**
     * @type {WpBuildApp[]}
     */
    apps;
    /**
     * @type {typedefs.WpBuildCombinedRuntimeArgs}
     */
    args;
    /**
     * @type {typedefs.WpBuildRcBuilds}
     */
    builds;
    /**
     * @type {string}
     */
    detailedDisplayName;
    /**
     * @type {typedefs.WpBuildRcEnvironment}
     */
    development;
    /**
     * @type {string}
     */
    displayName;
    /**
     * @type {typedefs.WpBuildRcExports}
     */
    exports;
    /**
     * @type {typedefs.WpBuildGlobalEnvironment}
     */
    global;
    /**
     * @type {typedefs.WpBuildRcLog}
     */
    log;
    /**
     * @type {typedefs.WpBuildWebpackMode}
     */
    mode;
    /**
     * @type {string}
     */
    name;
    /**
     * @type {typedefs.WpBuildRcPaths}
     */
    paths;
    /**
     * @type {typedefs.WpBuildRcPackageJson}
     */
    pkgJson;
    /**
     * @type {typedefs.WpBuildRcPlugins}
     */
    plugins;
    /**
     * @type {typedefs.WpBuildRcEnvironment}
     */
    production;
    /**
     * @type {boolean}
     */
    publicInfoProject;
    /**
     * @type {typedefs.WpBuildRcSourceCodeType}
     */
    source;
    /**
     * @type {typedefs.WpBuildRcEnvironment}
     */
    test;
    /**
     * @type {typedefs.WpBuildRcEnvironment}
     */
    testproduction;
    /**
     * @type {typedefs.WpBuildRcVsCode}
     */
    vscode;


    /**
     * @class WpBuildRc
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     */
    constructor(argv, arge)
    {
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) =>
        {
            arge[k] = arge[k].toLowerCase() === "true";
        });

        apply(this,
        {
            args: apply({}, arge, argv),
            global: globalEnv,
            mode: this.getMode(arge, argv, true)
        });

        if (!isWpBuildWebpackMode(this.mode)) {
            throw WpBuildError.getErrorMissing("mode", "utils/rc.js", { mode: this.mode });
        }

        apply(this,
            this.getJson(this, ".wpbuildrc.json", resolve(__dirname, "..")),
            this.getJson(this, ".wpbuildrc.defaults.json", resolve(__dirname, "..", "schema"))
        );

        this.pkgJson = pick(
            this.getJson(this.pkgJson, "package.json", resolve(__dirname, "..", "..")),
            ...WpBuildRcPackageJsonProps
        );

        this.configureBuilds();

        // if (argv.mode && !isWebpackMode(this.mode))
        // {
        //     argv.mode = "none";
        //     if (process.argv.includes("--mode")) {
        //         process.argv[process.argv.indexOf("--mode") + 1] = "none";
        //     }
        // }

		this.global.verbose = !!this.args.verbosity && this.args.verbosity !== "none";
        this.printBanner(this, arge, argv);
    };


    /**
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @returns {typedefs.WpBuildWebpackConfig[]} arge
     */
    static create = (argv, arge) =>
    {
        const rc = new WpBuildRc(argv, arge);
        rc.apps = rc.builds.filter((b) => !arge.build || b.name === arge.build)
                           .map((b) => new WpBuildApp(rc, merge({}, b)));
        return rc.apps.map(app => app.wpc);
    }


	/**
	 * @function
	 * @private
	 */
    configureBuilds = () =>
    {
        /**
         * @param {typedefs.WpBuildRcBuild} dst
         * @param {typedefs.WpBuildRcEnvironmentBase} src
         */
        const _applyBase = (dst, src) =>
        {
            dst.mode = dst.mode || this.mode;
            if (this.initializeBaseRc(dst) && this.initializeBaseRc(src))
            {
                dst.source = dst.source || this.source || "typescript";
                dst.target = this.getTarget(dst);
                dst.type = this.getType(dst);
                mergeIf(dst.log, src.log);
                mergeIf(dst.log.pad, src.log.pad);
                mergeIf(dst.log.colors, src.log.colors);
                dst.log.colors.valueStar = dst.log.color;
                dst.log.colors.buildBracket = dst.log.color;
                dst.log.colors.tagBracket = dst.log.color;
                dst.log.colors.infoIcon = dst.log.color;
                applyIf(dst.paths, src.paths);
                applyIf(dst.exports, src.exports);
                applyIf(dst.plugins, src.plugins);
                mergeIf(dst.alias, src.alias);
            }
            return dst;
        };

        this.builds.forEach((build) => _applyBase(build, this));

        const modeRc = /** @type {Partial<typedefs.WpBuildRcEnvironment>} */(this[this.mode]);
        modeRc?.builds?.filter(b => isArray(b)).forEach((modeBuild) =>
        {
            let baseBuild = this.builds.find(base => base.name === modeBuild.name);
            if (baseBuild) {
                _applyBase(baseBuild, modeBuild);
            }
            else {
                baseBuild = merge({}, modeBuild);
                _applyBase(baseBuild, this);
                this.builds.push(baseBuild);
            }
        });

        this.builds.forEach((build) => this.resolvePaths(build));
    };


    // /**
    //  * @param {typedefs.WpBuildRcBuild | string} build
    //  * @returns {Required<typedefs.WpBuildRcBuild>}
    //  */
    // getBuild = (build) =>
    // {
    //     const builds = /** @type {Required<typedefs.WpBuildRcBuilds>}  */(this.builds);
    //     if (!isString(build) && this.initializeBaseRc(build)) {
    //         return build;
    //     }
    //     const b = this.builds.find(b => b.name === build);
    //     if (b) {
    //         return merge({}, b);
    //     }
    //     return this.builds[0];
    // };


    /**
     * @function
     * @template T
     * @private
     * @param {T} thisArg
     * @param {string} file
     * @param {string} dirPath
     * @returns {T}
     * @throws {WpBuildError}
     */
    getJson = (thisArg, file, dirPath = resolve()) =>
    {
        const path = join(dirPath, file);
        try {
            return JSON5.parse(readFileSync(path, "utf8"));
        }
        catch (error)
        {
            const parentDir = dirname(dirPath);
            if (parentDir === dirPath) {
                throw new WpBuildError(`Could not locate or parse '${basename(file)}', check existence or syntax`, "utils/rc.js");
            }
            return this.getJson(thisArg, file, parentDir);
        }
    };


    /**
     * @function
     * @private
     * @template {boolean | undefined} T
     * @template {typedefs.WebpackMode | typedefs.WpBuildWebpackMode} R = T extends false | undefined ? typedefs.WebpackMode : typedefs.WpBuildWebpackMode
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge Webpack build environment
     * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line args
     * @param {T} [wpBuild] Convert to WpBuildWebpackMode @see {@link typedefs.WpBuildWebpackMode WpBuildWebpackMode}
     * @returns {R}
     */
    getMode = (arge, argv, wpBuild) =>
    {
        let mode = argv.mode || arge.mode || "production";
        if (wpBuild === true && mode === "none") {
            mode = "test";
        }
        return /** @type {R} */(mode);
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildRcBuild} build
     */
    getTarget = (build) =>
    {
        let target = build.target;
        if (!target)
        {
            target = "node";
            if (isWebpackTarget(this.args.target)) {
                target = this.args.target;
            }
            else if ((/web(?:worker|app|view)/).test(build.name) || build.type === "webapp") {
                target = "webworker";
            }
            else if ((/web|browser/).test(build.name) || build.type === "webmodule") {
                target = "web";
            }
            else if ((/module|node/).test(build.name) || build.type === "module") {
                target = "node";
            }
            else if ((/tests?/).test(build.name) && build.mode.startsWith("test")) {
                target = "node";
            }
            else if ((/typ(?:es|ings)/).test(build.name)|| build.type === "types") {
                target = "node";
            }
        }
        return target;
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildRcBuild} build
     */
    getType = (build) =>
    {
        let type = build.type;
        if (!type)
        {
            type = "module";
            if (isWpBuildRcBuildType(build.name))
            {
                type = build.name;
            }
            else if ((/web(?:worker|app|view)/).test(build.name)) {
                type = "webapp";
            }
            else if ((/web|browser/).test(build.name)) {
                type = "webmodule";
            }
            else if ((/tests?/).test(build.name)) {
                type = "tests";
            }
            else if ((/typ(?:es|ings)/).test(build.name)) {
                type = "types";
            }
            else if (build.target === "web") {
                type = "webmodule";
            }
            else if (build.target === "webworker") {
                type = "webapp";
            }
        }
        return type;
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildRc} rc
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @param {typedefs.WebpackRuntimeArgs} argv
     */
    printBanner = (rc, arge, argv) =>
    {
        WpBuildConsoleLogger.printBanner(rc.displayName, rc.pkgJson.version || "1.0.0", ` Start ${rc.detailedDisplayName || rc.displayName} Webpack Build`, (logger) =>
        {
            logger.write("   Mode  : " + logger.withColor(rc.mode, logger.colors.grey), 1, "", 0, logger.colors.white);
            logger.write("   Argv  : " + logger.withColor(JSON.stringify(argv), logger.colors.grey), 1, "", 0, logger.colors.white);
            logger.write("   Env   : " + logger.withColor(JSON.stringify(arge), logger.colors.grey), 1, "", 0, logger.colors.white);
            logger.sep();
        });
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildRcEnvironmentBase} rc
     * @returns {rc is Required<typedefs.WpBuildRcEnvironmentBase>}
     */
    initializeBaseRc = (rc) =>
    {
        if (!rc.log) {
            rc.log = { level: 2, colors: { default: "grey" }, pad: { value: 50 } };
        }
        if (!rc.log.colors) {
            rc.log.colors = { default: "grey" };
        }
        else if (!rc.log.colors.default) {
            rc.log.colors.default = "grey";
        }
        if (!rc.log.pad) {
            rc.log.pad = { value: 50 };
        }
        if (!rc.plugins) {
            rc.plugins = {};
        }
        if (!rc.exports) {
            rc.exports = {};
        }
        if (!rc.alias) {
            rc.alias = {};
        }
        if (!rc.paths)
        {
            rc.paths = {
                base: ".",
                temp: "node_modules/.cache/wpbuild/temp"
            };
        }
        return true;
    };


	/**
	 * @function
	 * @private
	 * @param {typedefs.WpBuildRcBuild} build
	 */
	resolvePaths = (build) =>
	{
		const base = resolve(__dirname, "..", ".."),
              ostemp = process.env.TEMP || process.env.TMP,
			  temp = resolve(ostemp ? `${ostemp}${sep}${this.name}` :
                                      `${base}${sep}node_modules${sep}.cache${sep}wpbuild${sep}temp`, build.mode);
        /**
         * @param {string} b base directory
         * @param {string} p configured path (relative or absolute)
         */
        const _resolveRcPath = (b, p) => { if (!isAbsolute(p)) { p = resolve(b, p); } return p; };

		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}

        build.paths.base = base;
        build.paths.temp = temp;
        build.paths.ctx = build.paths.ctx ? _resolveRcPath(base, build.paths.ctx) : base;
        build.paths.src = _resolveRcPath(base, build.paths.src || "src");
        build.paths.dist = _resolveRcPath(base, build.paths.dist || "dist");
        if (build.source === "typescript") {
            build.paths.tsconfig = build.paths.tsconfig ? _resolveRcPath(base, build.paths.tsconfig) : findTsConfig(build);
        }
        else {
            build.paths.tsconfig = undefined;
        }
	};

}


module.exports = WpBuildRc;

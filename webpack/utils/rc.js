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
const { readFileSync } = require("fs");
const { globalEnv } = require("./global");
const typedefs = require("../types/typedefs");
const WpBuildConsoleLogger = require("./console");
const { resolve, basename, join, dirname } = require("path");
const { WpBuildError, apply, pick, isString, merge, isObject, isArray, pickNot, mergeIf, applyIf } = require("./utils");
const {
    isWpBuildRcBuildType, isWpBuildWebpackMode, isWebpackTarget, WpBuildWebpackModes
} = require("./constants");


/**
 * @type {(keyof typedefs.WpBuildRcPackageJson)[]}
 */
const WpBuildRcPackageJsonProps = [ "author", "description", "displayName", "main", "module", "name", "publisher", "version" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildRcPackageJson}
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
     * @type {string}
     */
    singleBuildName;
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
     * @type {typedefs.WpBuildRcBuildType}
     */
    type;
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
        // @ts-ignore
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) =>
        {
            // @ts-ignore
            arge[k] = arge[k].toLowerCase() === "true";
        });

        const buildName = arge.name || /** @deprecated */arge.build;
        apply(this,
        {
            // args: apply({}, pickNot(arge, "build"), argv),
            args: apply({}, arge, argv),
            build: buildName,
            global: globalEnv,
            mode: this.getMode(arge, argv, true),
            singleBuildName: buildName,
            singleBuildType: arge.type,
            type: arge.type
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

        this.prepBuilds(argv, this.builds);
        WpBuildWebpackModes.filter(m => m !== "none" && !!this[m].builds).forEach(
            (m) => this.prepBuilds(argv, this[m].builds, m)
        );

        this.applyBuilds();

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
        if (arge.build && !arge.name) {
            arge.name = arge.build;
        }
        rc.apps = rc.builds.filter(
            (b) => !rc.singleBuildName || b.name === rc.singleBuildName || b.build === rc.singleBuildName
        ).map(
            (b) => new WpBuildApp(rc, b)
        );
        return rc.apps.map(app => app.wpc);
    }


	/**
	 * @function
	 * @private
	 */
    applyBuilds = () =>
    {
        /**
         * @param {typedefs.WpBuildRcEnvironmentBase} dst
         */
        const _apply = (dst, src) =>
        {
            if (this.initializeBaseRc(dst))
            {
                if (isObject(dst.log))
                {
                    mergeIf(dst.log, src.log);
                    mergeIf(dst.log.pad, src.log.pad);
                    mergeIf(dst.log.colors, src.log.colors);
                    dst.log.colors.valueStar = dst.log.color;
                    dst.log.colors.buildBracket = dst.log.color;
                    dst.log.colors.tagBracket = dst.log.color;
                    dst.log.colors.infoIcon = dst.log.color;
                }
                if (isObject(dst.paths)) {
                    applyIf(dst.paths, src.paths);
                }
                if (isObject(dst.exports)) {
                    applyIf(dst.exports, src.exports);
                }
                if (isObject(dst.plugins)) {
                    applyIf(dst.plugins, src.plugins);
                }
                if (isObject(dst.alias)) {
                    mergeIf(dst.alias, src.alias);
                }
            }
            return dst;
        };

        this.builds.forEach((build) => _apply(build, this));

        const modeRc = /** @type {Partial<typedefs.WpBuildRcEnvironment>} */(this[this.mode]);
        if (modeRc && isArray(modeRc.builds))
        {
            modeRc.builds.forEach((modeBuild) =>
            {
                // _apply(modeBuild, this);
                let baseBuild = this.builds.find(base => base.name === modeBuild.name);
                if (baseBuild) {
                    merge(baseBuild, modeBuild);
                }
                else {
                    baseBuild = merge({}, modeBuild);
                    _apply(baseBuild, this);
                    this.builds.push(baseBuild);
                }
                // if (modeBuild.name === this.args.name) {
                //     _apply(modeBuild);
                // }
            });
        }

        // if (buildName) {
        //     this.build = this.builds.find(b => b.name = buildName);
        // }

        // WpBuildWebpackModes.forEach(m => delete this[m]);
    };


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
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRcBuilds} builds
     * @param {typedefs.WpBuildWebpackMode | undefined} [modeBuild]
     */
    prepBuilds = (argv, builds, modeBuild) =>
    {
        for (const build of builds)
        {
            // build.name = build.name || buildName || "module";
            build.mode = build.mode || modeBuild || this.mode;
            build.type ||= this.type;

            if (!build.target)
            {
                build.target = "node";
                if (isWebpackTarget(argv.target)) {
                    build.target = argv.target;
                }
                else if ((/web(?:worker|app|view)/).test(build.name) || build.type === "webapp") {
                    build.target = "webworker";
                }
                else if ((/web|browser/).test(build.name) || build.type === "webmodule") {
                    build.target = "web";
                }
                else if ((/module|node/).test(build.name) || build.type === "module") {
                    build.target = "node";
                }
                else if ((/tests?/).test(build.name) && build.mode.startsWith("test")) {
                    build.target = "node";
                }
                else if ((/typ(?:es|ings)/).test(build.name)|| build.type === "types") {
                    build.target = "node";
                }
            }

            if (!build.type)
            {
                build.type = "module";
                if (isWpBuildRcBuildType(build.name))
                {
                    build.type = build.name;
                }
                else if ((/web(?:worker|app|view)/).test(build.name)) {
                    build.type = "webapp";
                }
                else if ((/web|browser/).test(build.name)) {
                    build.type = "webmodule";
                }
                else if ((/tests?/).test(build.name)) {
                    build.type = "tests";
                }
                else if ((/typ(?:es|ings)/).test(build.name)) {
                    build.type = "types";
                }
                else if (build.target === "web") {
                    build.type = "webmodule";
                }
                else if (build.target === "webworker") {
                    build.type = "webapp";
                }
            }
        }
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
     * @param {typedefs.WpBuildRcEnvironmentBase} rc
     * @returns {rc is typedefs.WpBuildRcEnvironmentBase}
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
            rc.plugins = {};
        }
        if (!rc.alias) {
            rc.alias = {};
        }
        return true;
    };

}


module.exports = WpBuildRc;

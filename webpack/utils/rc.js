/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const JSON5 = require("json5");
const { globalEnv } = require("./global");
const typedefs = require("../types/typedefs");
const WpBuildConsoleLogger = require("./console");
const { resolve, basename, join, dirname } = require("path");
const { readFileSync, existsSync, writeFileSync } = require("fs");
const { WpBuildError, apply, pick, isString, merge, isObject, isArray, pickNot } = require("./utils");
const {
    isWpBuildRcBuildType, isWpBuildWebpackMode, isWebpackTarget, WpBuildWebpackModes, WpBuildRcPackageJsonProps
} = require("./constants");


/**
 * @class
 * @implements {typedefs.IWpBuildRcSchema}
 */
class WpBuildRc
{
    /**
     * @type {typedefs.WpBuildRuntimeEnvArgs}
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
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) =>
        {
            arge[k] = arge[k].toLowerCase() === "true";
        });

        apply(this,
        {
            args: apply({}, pickNot(arge, "build"), argv),
            mode: this.getMode(arge, argv, true),
            name: arge.name || /** @deprecated */arge.build,
            type: arge.type,
            global: globalEnv
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

        this.validateRc(this);

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
	 * @function
	 * @private
	 */
    applyBuilds = () =>
    {
        /**
         * @param {typedefs.WpBuildRcEnvironmentBase} rcChild
         * @param {boolean} [isModeRc]
         */
        const _applyOverrides = (rcChild, isModeRc) =>
        {
            if (isObject(rcChild.log))
            {
                merge(this.log, rcChild.log);
                if (this.log.color) {
                    this.log.colors.valueStar = rcChild.log.color;
                    this.log.colors.buildBracket = rcChild.log.color;
                    this.log.colors.tagBracket = rcChild.log.color;
                    this.log.colors.infoIcon = rcChild.log.color;
                }
            }
            if (isObject(rcChild.paths)) {
                apply(this.paths, rcChild.paths);
            }
            if (isObject(rcChild.exports)) {
                apply(this.exports, rcChild.exports);
            }
            if (isObject(rcChild.plugins)) {
                apply(this.plugins, rcChild.plugins);
            }
        };

        const modeRc = /** @type {Partial<typedefs.WpBuildRcEnvironment>} */(this[this.mode]);
        if (modeRc)
        {
            _applyOverrides(modeRc);
            if (isArray(modeRc.builds))
            {
                modeRc.builds.forEach((modeBuild) =>
                {
                    let baseBuild = this.builds.find(base => base.name === modeBuild.name);
                    if (baseBuild) {
                        this.validateRc(baseBuild);
                        merge(baseBuild, modeBuild);
                    }
                    else {
                        baseBuild = merge({}, modeBuild);
                        this.validateRc(baseBuild);
                        this.builds.push(baseBuild);
                    }
                    if (modeBuild.name === this.args.name) {
                        _applyOverrides(modeBuild);
                    }
                });
            }
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
        /** @type {typedefs.WebpackMode | typedefs.WpBuildWebpackMode | undefined} */
        let mode = argv.mode;
        if (!mode)
        {
            if (arge.mode === "development" || argv.mode === "development") {
                mode = "development";
            }
            else if (arge.mode === "none" || argv.mode === "none" || arge.mode === "test" || arge.type === "tests") {
                mode = "none";
            }
            else {
                mode = "production";
            }
        }
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


    validateRc = (rc) =>
    {
        if (!rc.log.colors) {
            rc.log.colors = { default: "grey" };
        }
        else if (!rc.log.colors.default) {
            rc.log.colors.default = "grey";
        }
        if (!rc.builds) {
            rc.builds = [];
        }
    };

}


module.exports = WpBuildRc;

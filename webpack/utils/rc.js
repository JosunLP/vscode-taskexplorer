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
        const buildName = arge.name || /** @deprecated */arge.build;
        this.global = globalEnv;

        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) =>
        {
            arge[k] = arge[k].toLowerCase() === "true";
        });

        apply(this,
        {
            args: apply({}, pickNot(arge, "build"), argv),
            mode: this.getMode(arge, argv, true),
            name: buildName,
            type: arge.type
        });

        if (!isWpBuildWebpackMode(this.mode)) {
            throw WpBuildError.getErrorMissing("mode", "utils/rc.js", { mode: this.mode });
        }

        apply(this,
            this.getJson(this, ".wpbuildrc.json", resolve(__dirname, "..")),
            this.getJson(this, ".wpbuildrc.defaults.json", resolve(__dirname, "..", "types"))
        );

        this.pkgJson = pick(
            this.getJson(this.pkgJson, "package.json", resolve(__dirname, "..", "..")),
            ...WpBuildRcPackageJsonProps
        );

        this.builds = this.builds || [];
        this.prep(buildName, argv, this.builds);
        WpBuildWebpackModes.filter(m => m !== "none" && !!this[m].builds).forEach(
            (m) => this.prep(buildName, argv, this[m].builds, m)
        );

        this.applyBuilds(buildName);

		globalEnv.verbose = !!this.args.verbosity && this.args.verbosity !== "none";

        // if (argv.mode && !isWebpackMode(this.mode))
        // {
        //     argv.mode = "none";
        //     if (process.argv.includes("--mode")) {
        //         process.argv[process.argv.indexOf("--mode") + 1] = "none";
        //     }
        // }

        this.printBanner(this, arge, argv);
    };


	/**
	 * @function
	 * @private
	 * @param {string | undefined} buildName
	 */
    applyBuilds = (buildName) =>
    {
        /**
         * @param {typedefs.WpBuildRcEnvironmentBase} rc
         */
        const _applyOverrides = (rc) =>
        {
            if (isObject(rc.log))
            {
                if (rc.log.color) {
                    this.log.colors.valueStar = rc.log.color;
                    this.log.colors.buildBracket = rc.log.color;
                    this.log.colors.tagBracket = rc.log.color;
                    this.log.colors.infoIcon = rc.log.color;
                }
                merge(this.log, rc.log);
            }
            if (isObject(rc.paths)) {
                apply(this.paths, rc.paths);
            }
            if (isObject(rc.exports)) {
                apply(this.exports, rc.exports);
            }
            if (isObject(rc.plugins)) {
                apply(this.plugins, rc.plugins);
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
                    const baseBuild = this.builds.find(base => base.name === modeBuild.name);
                    if (baseBuild) {
                        _applyOverrides(modeBuild);
                        merge(baseBuild, modeBuild);
                    }
                    else if (!buildName || modeBuild.name === buildName) {
                        this.builds.push(merge({}, modeBuild));
                        _applyOverrides(modeBuild);
                    }
                });
            }
        }

        // WpBuildWebpackModes.forEach(m => delete this[m]);
    };


    /**
     * @function
     * @template T
     * @private
     * @param {T} thisArg
     * @param {string} file
     * @param {string} dirPath
     * @param {number} [tryCount]
     * @returns {T}
     * @throws {WpBuildError}
     */
    getJson = (thisArg, file, dirPath = resolve(), tryCount = 1) =>
    {
        const path = join(dirPath, file);
        try {
            if (tryCount === 1 && file === ".wpbuildrc.json" && !existsSync(path))
            {
                let defaultsPath = resolve(dirname(path), path.replace(".json", ".defaults.json"));
                if (existsSync(defaultsPath))
                {
                    writeFileSync(path, readFileSync(defaultsPath));
                }
                else
                {
                    defaultsPath = resolve(dirname(path), "schema", path.replace(".json", ".defaults.json"));
                    if (existsSync(defaultsPath))
                    {
                        writeFileSync(path, readFileSync(defaultsPath));
                    }
                }
            }
            return JSON5.parse(readFileSync(path, "utf8"));
        }
        catch (error)
        {
            const parentDir = dirname(dirPath);
            if (parentDir === dirPath) {
                throw new WpBuildError(`Could not locate or parse '${basename(file)}', check existence or syntax`, "utils/rc.js");
            }
            return this.getJson(thisArg, file, parentDir, ++tryCount);
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
     * @param {string | undefined} buildName
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRcBuilds} builds
     * @param {string | undefined} [modeBuild]
     */
    prep = (buildName, argv, builds, modeBuild) =>
    {   //
        // If build name was specified on the cmd line, remove all other builds from rc defintion
        //
        if (buildName) {
            builds.slice().reverse().forEach(
                (b, i, a) => builds.splice(a.length - 1 - i, b.name !== buildName ? 1 : 0)
            );
        }
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

}


module.exports = WpBuildRc;

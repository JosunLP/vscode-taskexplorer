/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const JSON5 = require("json5");
const { getMode } = require("../exports");
const typedefs = require("../types/typedefs");
const WpBuildConsoleLogger = require("./console");
const { WpBuildError, apply, pick } = require("./utils");
const { resolve, basename, join, dirname } = require("path");
const { readFileSync, existsSync, writeFileSync } = require("fs");
const { isWpBuildRcBuildType, isWpBuildWebpackMode, isWebpackTarget } = require("./constants");


/**
 * @class
 * @implements {typedefs.IWpBuildRcSchema}
 */
class WpBuildRc
{
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
     * @type {typedefs.WpBuildRcLog}
     */
    log;
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
        const mode = getMode(arge, argv, true);
        if (!isWpBuildWebpackMode(mode)) {
            throw WpBuildError.getErrorMissing("mode", "utils/rc.js", { mode });
        }
        apply(this, this.readWpBuildRc(mode, argv, arge));
        WpBuildConsoleLogger.printBanner(this, mode, argv, arge);
    };


    /**
     * @template T
     * @function
     * @private
     * @param {string} file
     * @param {string} dirPath
     * @param {number} [tryCount]
     * @returns {{ path: string; data: T }}
     * @throws {WpBuildError}
     */
    find = (file, dirPath = resolve(), tryCount = 1) =>
    {
        const path = join(dirPath, file);
        try {
            if (tryCount == 1 && file === ".wpbuildrc.json" && !existsSync(path))
            {
                let defaultsPath = resolve(dirname(path), path.replace(".json", ".defaults.json"));
                if (existsSync(defaultsPath))
                {
                    writeFileSync(path, readFileSync(defaultsPath));
                }
                else
                {
                    defaultsPath = resolve(dirname(path), "types", path.replace(".json", ".defaults.json"));
                    if (existsSync(defaultsPath))
                    {
                        writeFileSync(path, readFileSync(defaultsPath));
                    }
                }
            }
            return { path, data: JSON.parse(readFileSync(path, "utf8")) };
        }
        catch (error)
        {
            const parentDir = dirname(dirPath);
            if (parentDir === dirPath) {
                throw new WpBuildError(`Could not locate or parse '${basename(file)}', check existence or syntax`, "utils/rc.js");
            }
            return this.find(file, parentDir, ++tryCount);
        }
    };


    /**
     * @function
     * @private
     * @param {string | undefined} buildName
     * @param {typedefs.WpBuildWebpackMode} mode
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @param {typedefs.WpBuildRcBuilds} builds
     */
    prep = (buildName, mode, argv, arge, builds) =>
    {   //
        // If build name was specified on the cmd line, remove all other builds from rc defintion
        //
        builds.slice().reverse().forEach(
            (b, i, a) => builds.splice(a.length - 1 - i, !buildName && b.name !== buildName ? 1 : 0)
        );

        for (const build of builds)
        {
            build.mode = build.mode || mode;

            if (!build.target)
            {
                build.target = "node"
                if (isWebpackTarget(argv.target)) {
                    build.target = argv.target;
                }
                else if ((/web(?:worker|app|view)/).test(build.name) || build.type === "webapp") {
                    build.target = "webworker"
                }
                else if ((/web|browser/).test(build.name) || build.type === "webmodule") {
                    build.target = "web"
                }
                else if ((/module|node/).test(build.name) || build.type === "module") {
                    build.target = "node";
                }
                else if ((/tests?/).test(build.name) && mode.startsWith("test")) {
                    build.target = "node";
                }
                else if ((/typ(?:es|ings)/).test(build.name)|| build.type === "types") {
                    build.target = "node"
                }
            }

            if (!build.type)
            {
                build.type = "module"
                if (isWpBuildRcBuildType(build.name))
                {
                    build.type = build.name;
                }
                else if ((/web(?:worker|app|view)/).test(build.name)) {
                    build.type = "webapp"
                }
                else if ((/web|browser/).test(build.name)) {
                    build.type = "webmodule"
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
     * @returns {typedefs.WpBuildRcPackageJson}
     * @throws {WpBuildError}
     */
    readPackageJson = () =>
    {
        const pkgJson = this.find("package.json", resolve(__dirname, "..", ".."));
        return pick(/** @type {typedefs.WpBuildRcPackageJson} */(pkgJson.data), "author", "description", "main", "module", "name", "version", "publisher");
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildWebpackMode} mode
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @returns {WpBuildRc}
     * @throws {WpBuildError}
     */
    readWpBuildRc = (mode, argv, arge) =>
    {
        const buildName = arge.name || /** @deprecated */arge.build,
              rcJson = this.find(".wpbuildrc.json", resolve(__dirname, "..")),
              defRcPath = resolve(__dirname, "..", "types", ".wpbuildrc.defaults.json"),
              pkgJson = this.readPackageJson();

        const rc = /** @type {WpBuildRc} */(apply(JSON5.parse(readFileSync(defRcPath, "utf8")), rcJson.data, { pkgJson }));
        if (!rc.builds)
        {
            throw WpBuildError.getErrorProperty("builds", "utils/rc.js", { mode: /** @type {typedefs.WebpackMode} */(mode) });
        }

        this.prep(buildName, mode, argv, arge, rc.builds);
        this.prep(buildName, mode, argv, arge, rc.development.builds);
        this.prep(buildName, mode, argv, arge, rc.production.builds);
        this.prep(buildName, mode, argv, arge, rc.test.builds);
        this.prep(buildName, mode, argv, arge, rc.testproduction.builds);

        return rc;
    };

}


module.exports = WpBuildRc;

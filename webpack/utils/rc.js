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
const gradient = require("gradient-string");
const WpBuildConsoleLogger = require("./console");
const { WpBuildError, apply, pick, merge } = require("./utils");
const { resolve, basename, join, dirname } = require("path");
const { readFileSync, existsSync, writeFileSync } = require("fs");

/** @typedef {import("../types").IDisposable} IDisposable */
/** @typedef {import("../types").WpBuildRcLog} WpBuildRcLog */
/** @typedef {import("../types").WpBuildRcPaths} WpBuildRcPaths */
/** @typedef {import("../types").WpBuildRcBuilds} WpBuildRcBuilds */
/** @typedef {import("../types").WpBuildRcVsCode} WpBuildRcVsCode */
/** @typedef {import("../types").IWpBuildRcSchema} IWpBuildRcSchema */
/** @typedef {import("../types").WpBuildRcExports} WpBuildRcExports */
/** @typedef {import("../types").WpBuildRcPlugins} WpBuildRcPlugins */
/** @typedef {import("../types").WpBuildWebpackMode} WpBuildWebpackMode */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRcEnvironment} WpBuildRcEnvironment */
/** @typedef {import("../types").WpBuildRcPackageJson} WpBuildRcPackageJson */
/** @typedef {import("../types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */


/**
 * @class
 * @implements {IDisposable}
 * @implements {IWpBuildRcSchema}
 */
class WpBuildRc
{
    /**
     * @type {WpBuildRcBuilds}
     */
    builds;
    /**
     * @type {string}
     */
    detailedDisplayName;
    /**
     * @type {WpBuildRcEnvironment}
     */
    development;
    /**
     * @type {string}
     */
    displayName;
    /**
     * @type {WpBuildRcExports}
     */
    exports;
    /**
     * @type {WpBuildRcLog}
     */
    log;
    /**
     * @type {string}
     */
    name;
    /**
     * @type {WpBuildRcPaths}
     */
    paths;
    /**
     * @type {WpBuildRcPackageJson}
     */
    pkgJson;
    /**
     * @type {WpBuildRcPlugins}
     */
    plugins;
    /**
     * @type {WpBuildRcEnvironment}
     */
    production;
    /**
     * @type {boolean}
     */
    publicInfoProject;
    /**
     * @type {WpBuildRcEnvironment}
     */
    test;
    /**
     * @type {WpBuildRcEnvironment}
     */
    testproduction;
    /**
     * @type {WpBuildRcVsCode}
     */
    vscode;


    /**
     * @class WpBuildRc
     * @param {WpBuildWebpackMode} mode
     * @param {WebpackRuntimeArgs} argv
     * @param {WpBuildRuntimeEnvArgs} arge
     */
    constructor(mode, argv, arge)
    {
        apply(this, this.readWpBuildRc(mode));
        this.printBanner(mode, argv, arge);
    };


    dispose = () => {};


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
     * @param {WpBuildConsoleLogger} logger
     */
    printLineSep = (logger) =>
    {
        logger.write("------------------------------------------------------------------------------------------------------------------------");
    };


    /**
     * @function
     * @private
     * @param {WpBuildWebpackMode} mode
     * @param {WebpackRuntimeArgs} argv
     * @param {WpBuildRuntimeEnvArgs} arge
     */
    printBanner = (mode, argv, arge) =>
    {
        const logger = new WpBuildConsoleLogger();
        this.printLineSep(logger);
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        console.log(gradient("red", "cyan", "pink", "green", "purple", "blue").multiline(this.spmBanner(), {interpolation: "hsv"}));
        this.printLineSep(logger);
        logger.write(gradient("purple", "blue", "pink", "green", "purple", "blue").multiline(` Start ${this.detailedDisplayName || this.displayName} Webpack Build`));
        this.printLineSep(logger);
        logger.write("   Mode  : " + logger.withColor(mode, logger.colors.grey), 1, "", 0, logger.colors.white);
        logger.write("   Argv  : " + logger.withColor(JSON.stringify(argv), logger.colors.grey), 1, "", 0, logger.colors.white);
        logger.write("   Env   : " + logger.withColor(JSON.stringify(arge), logger.colors.grey), 1, "", 0, logger.colors.white);
        this.printLineSep(logger);
        logger.dispose();
    };


    /**
     * @function
     * @private
     * @returns {WpBuildRcPackageJson}
     * @throws {WpBuildError}
     */
    readPackageJson = () =>
    {
        const pkgJson = this.find("package.json", resolve(__dirname, "..", ".."));
        return pick(pkgJson.data, "author", "description", "main", "module", "name", "version", "publisher");
    };


    /**
     * @function
     * @private
     * @param {WpBuildWebpackMode} mode
     * @returns {WpBuildRc}
     * @throws {WpBuildError}
     */
    readWpBuildRc = (mode) =>
    {
        const rcJson = this.find(".wpbuildrc.json", resolve(__dirname, "..")),
              defRcPath = resolve(__dirname, "..", "types", ".wpbuildrc.defaults.json"),
              pkgJson = this.readPackageJson(),
              rc = apply(JSON5.parse(readFileSync(defRcPath, "utf8")), rcJson.data, { pkgJson });
        if (mode === "none") {
            mode = "test";
        }
        if (rc[mode]) {
            merge(rc, rc[mode])
        }
        delete rc["development"];
        delete rc["production"];
        delete rc["test"];
        delete rc["testproduction"];
        if (!rc.builds)
        {
            throw new WpBuildError("Required propery 'builds' not set in rc configuratioon file", "utils/rc.js");
        }
        return rc;
    };


    // /**
    //  * @function
    //  * @private
    //  * @param {WpBuildConsoleLogger} logger
    //  * @returns {string}
    //  */
    // const spmBanner = (app, version) =>
    // {
    //     return `        ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________
    //       (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  )
    //       \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ /
    //     ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  /
    //    (_____/|_|       | /       |_|   |_| (____/   ${version}   \\/
    //                          |/${app.padStart(51 - app.length)}`;
    // };


    /**
     * @function
     * @private
     * @returns {string}
     */
    spmBanner = () =>
    {
        return `        ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________   ____/^\\.  __//\\.____ __   ____  _____
          (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  ) /  _^ | | / //\\ /  __\\:(  // __\\// ___)
          \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ / (  (_| | |/ /|_| | ___/\\\\ // ___/| //
        ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  / /^\\__\\__| |\\ \\--._/\\____ \\\\/\\\\___ |_|
       (_____/|_|       | /       |_|   |_| (____/   ${this.pkgJson.version}  \\/ /        |/  \\:(           \\/           
                        |/${this.displayName.padStart(50 - this.displayName.length)}`;
    };

}


module.exports = WpBuildRc;

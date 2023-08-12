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
const { readFileSync } = require("fs");
const gradient = require("gradient-string");
const WpBuildConsoleLogger = require("./console");
const { WpBuildError, apply, pick } = require("./utils");
const { resolve, basename, join, dirname } = require("path");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").IDisposable} IDisposable */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildRcLog} WpBuildRcLog */
/** @typedef {import("../types").WpBuildRcPaths} WpBuildRcPaths */
/** @typedef {import("../types").WpBuildRcBuilds} WpBuildRcBuilds */
/** @typedef {import("../types").IWpBuildRcSchema} IWpBuildRcSchema */
/** @typedef {import("../types").WpBuildRcVsCode} WpBuildRcVsCode */
/** @typedef {import("../types").WpBuildRcExports} WpBuildRcExports */
/** @typedef {import("../types").WpBuildRcPlugins} WpBuildRcPlugins */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRcLogColorMap} WpBuildRcLogColorMap */
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
     * @member {WpBuildRcBuilds} builds
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcBuilds}
     */
    builds;
    /**
     * @member {WpBuildRcLogColorMap} colors
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcLogColorMap}
     */
    colors;
    /**
     * @member {string} detailedDisplayName
     * @memberof WpBuildRc.prototype
     * @type {string}
     */
    detailedDisplayName;
    /**
     * @member {string} displayName
     * @memberof WpBuildRc.prototype
     * @type {string}
     */
    displayName;
    /**
     * @member {WpBuildRcEnvironments} log
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcEnvironments}
     */
    environment;
    /**
     * @member {WpBuildRcExports} exports
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcExports}
     */
    exports;
    /**
     * @member {WpBuildRcLog} log
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcLog}
     */
    log;
    /**
     * @member {string} name
     * @memberof WpBuildRc.prototype
     * @type {string}
     */
    name;
    /**
     * @member {WpBuildRcPaths} paths
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcPaths}
     */
    paths;
    /**
     * @member {WpBuildRcPackageJson} pkgJson
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcPackageJson}
     */
    pkgJson;
    /**
     * @member {WpBuildRcPlugins} plugins
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcPlugins}
     */
    plugins;
    /**
     * @member {string | boolean} publicInfoProject
     * @memberof WpBuildRc.prototype
     * @type {string | boolean}
     */
    publicInfoProject;


    /**
     * @class WpBuildRc
     * @param {WebpackMode} mode
     * @param {WebpackRuntimeArgs} argv
     * @param {WpBuildRuntimeEnvArgs} arge
     */
    constructor(mode, argv, arge)
    {
        apply(this, this.readWpBuildRc());
        this.printBanner(mode, argv, arge);
    };


    dispose = () => {};


    /**
     * @template T
     * @function
     * @private
     * @param {string} file
     * @param {string} dirPath
     * @param {(...args: any[]) => T} [caller]
     * @returns {{ path: string; data: T }}
     * @throws {WpBuildError}
     */
    find = (file, dirPath = resolve(), caller) =>
    {
        const path = join(dirPath, file);
        try {
            return { path, data: JSON.parse(readFileSync(path, "utf8")) };
        }
        catch (error)
        {
            const parentDir = dirname(dirPath);
            if (parentDir === dirPath) {
                throw new WpBuildError(`Could not locate or parse '${basename(file)}', check existence or syntax`, "utils/rc.js");
            }
            return this.find(file, parentDir, caller);
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
     * @param {WebpackMode} mode
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
        const pkgJson = this.find("package.json", resolve(__dirname, "..", ".."), this.readPackageJson);
        return pick(pkgJson.data, "author", "description", "main", "module", "name", "version", "publisher");
    };


    /**
     * @function
     * @private
     * @returns {WpBuildRc}
     * @throws {WpBuildError}
     */
    readWpBuildRc = () =>
    {
        const rcJson = this.find(".wpbuildrc.json", resolve(__dirname, ".."), this.readWpBuildRc),
              defRcPath = resolve(__dirname, "..", "types", ".wpbuildrc.defaults.json");
        return apply(JSON5.parse(readFileSync(defRcPath, "utf8")), rcJson.data, { pkgJson: this.readPackageJson() });
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

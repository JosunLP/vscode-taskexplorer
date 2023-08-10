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
const { resolve, basename } = require("path");
const WpBuildConsoleLogger = require("./console");
const { merge, WpBuildError, findFilesSync, apply } = require("./utils");


/** @typedef {import("../types").IWpBuildRc} IWpBuildRc */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildRcLog} WpBuildRcLog */
/** @typedef {import("../types").WpBuildRcBuilds} WpBuildRcBuilds */
/** @typedef {import("../types").WpBuildRcVsCode} WpBuildRcVsCode */
/** @typedef {import("../types").WpBuildRcExports} WpBuildRcExports */
/** @typedef {import("../types").WpBuildRcPlugins} WpBuildRcPlugins */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("../types").WpBuildRcLogColorMap} WpBuildRcLogColorMap */
/** @typedef {import("../types").WpBuildRcPackageJson} WpBuildRcPackageJson */
/** @typedef {import("../types").WebpackRuntimeEnvArgs} WebpackRuntimeEnvArgs */


/**
 * @class
 * @implements {IWpBuildRc}
 */
class WpBuildRc
{
    /**
     * @member {string} bannerName
     * @memberof WpBuildRc.prototype
     * @type {string}
     */
    bannerName;
    /**
     * @member {string} vscode
     * @memberof WpBuildRc.prototype
     * @type {string}
     */
    bannerNameDetailed;
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
     * @member {string} displayName
     * @memberof WpBuildRc.prototype
     * @type {string}
     */
    displayName;
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
     * @member {string} version
     * @memberof WpBuildRc.prototype
     * @type {string}
     */
    version;
    /**
     * @member {WpBuildRcVsCode} vscode
     * @memberof WpBuildRc.prototype
     * @type {WpBuildRcVsCode}
     */
    vscode;


    /**
     * @class WpBuildRc
     * @param {WebpackMode} mode Webpack command line args
     * @param {WebpackRuntimeArgs} argv Webpack command line argsmmand line args
     * @param {WebpackRuntimeEnvArgs} env Webpack build environment
     */
    constructor(mode, argv, env)
    {
        apply(this, merge(this.wpBuildRc(), env, { pkgJson: this.packageJson() }));
        this.printBanner(mode,argv, env);
    };


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildRcPackageJson}
     * @throws {WpBuildError}
     */
    packageJson = () =>
    {
        const isNodeModule = __dirname.includes("node_modules"),
              basePath = isNodeModule ? resolve(__dirname, "..", "..", "..") : resolve(__dirname, "..", "..");
        const files = findFilesSync("**/package.json", {
            cwd: basePath, absolute: true, maxDepth: 2, nocase: true
        });
        if (files.length > 0)
        {
            try {
                return JSON5.parse(readFileSync(files[0], "utf8"));
            }
            catch (e) {
                throw new WpBuildError("Could not parse package.json, check syntax", "utils/app.js", e.message);
            }
        }
        throw new WpBuildError("Could not locate package.json", "utils/app.js");
    };


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildRc}
     * @throws {WpBuildError}
     */
    wpBuildRc = () =>
    {
        const isNodeModule = __dirname.includes("node_modules"),
              basePath = isNodeModule ? resolve(__dirname, "..", "..", "..") : resolve(__dirname, "..", "..");
        const files = findFilesSync("**/{webpack,wpbuild}/{,.}wpbuildrc{,.json}", {
            cwd: basePath, absolute: true, dot: true, maxDepth: 2, nocase: true
        });
        if (files.length > 0)
        {
            try {
                return JSON5.parse(readFileSync(files[0], "utf8"));
            }
            catch (e) {
                throw new WpBuildError(`Could not parse wpbuild config file ${basename(files[0])}, check syntax`, "utils/app.js", e.message);
            }
        }
        throw new WpBuildError("Could not locate a wpbuild config file", "utils/app.js");
    };


    /**
     * @function
     * @private
     * @member printLineSep
     * @param {WpBuildConsoleLogger} logger
     */
    printLineSep = (logger) =>
    {
        logger.write("------------------------------------------------------------------------------------------------------------------------");
    };


    /**
     * @function
     * @private
     * @member printBanner
     * @param {WebpackMode} mode Webpack co
     * @param {WebpackRuntimeArgs} argv Webpack command line argsmmand line args
     * @param {WebpackRuntimeEnvArgs} env Webpack build environment
     */
    printBanner = (mode, argv, env) =>
    {
        const logger = new WpBuildConsoleLogger(argv, env);
        this.printLineSep(logger);
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        console.log(gradient("red", "cyan", "pink", "green", "purple", "blue").multiline(this.spmBanner(), {interpolation: "hsv"}));
        this.printLineSep(logger);
        logger.write(gradient("purple", "blue", "pink", "green", "purple", "blue").multiline(` Start ${this.bannerNameDetailed} Webpack Build`));
        this.printLineSep(logger);
        logger.write("   Mode  : " + logger.withColor(mode, logger.colors.grey), 1, "", 0, logger.colors.white);
        logger.write("   Argv  : " + logger.withColor(JSON.stringify(app.argv), logger.colors.grey), 1, "", 0, logger.colors.white);
        logger.write("   Env   : " + logger.withColor(JSON.stringify(env), logger.colors.grey), 1, "", 0, logger.colors.white);
        this.printLineSep(logger);
    };


    // /**
    //  * @function
    //  * @private
    //  * @member spmBanner
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
     * @member spmBanner
     * @returns {string}
     */
    spmBanner = () =>
    {
        return `        ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________   ____/^\\.  __//\\.____ __   ____  _____
          (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  ) /  _^ | | / //\\ /  __\\:(  // __\\// ___)
          \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ / (  (_| | |/ /|_| | ___/\\\\ // ___/| //
        ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  / /^\\__\\__| |\\ \\--._/\\____ \\\\/\\\\___ |_|
       (_____/|_|       | /       |_|   |_| (____/   ${this.version}  \\/ /        |/  \\:(           \\/           
                        |/${this.displayName.padStart(50 - this.displayName.length)}`;
    };

}


module.exports = WpBuildRc;

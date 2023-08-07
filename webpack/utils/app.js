/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.utils.app
 */

const { resolve } = require("path");
const { globalEnv } = require("./global");
const gradient = require("gradient-string");
const { WebpackError } = require("webpack");
const WpBuildConsoleLogger = require("./console");
const { readFileSync, existsSync } = require("fs");
const { merge, pickBy, mergeIf } = require("./utils");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildAppRc} WpBuildAppRc */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPackageJson} WpBuildPackageJson */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackVsCodeBuild} WebpackVsCodeBuild */


/**
 * @class
 * @implements {WpBuildApp}
 */
class WpBuildApplication
{
    /**
     * @member {WpBuildAppRc} applyExportDefaults
     * @memberof WpBuildApplication.prototype
     * @public
     */
    rc;


    /**
     * @class WpBuildApplication
     * @param {WebpackMode} mode Webpack command line args
     * @param {Partial<WpBuildEnvironment>} env Webpack build environment
     */
    constructor(mode, env)
    {
        this.rc = /** @type {WpBuildAppRc} */({});
        this.applyWpBuildRc();
        this.applyPackageJson();
        this.applyPluginDefaults();
        this.applyExportDefaults();
        this.applyProperties();
        this.applyVsCodeDefaults();
        this.applyLogDefaults();
        this.printBanner(mode, /** @type {WpBuildEnvironment} */(env));
    };


    /**
     * @function
     * @private
     * @member applyExportDefaults
     */
    applyExportDefaults = () =>
    {
        if (!this.rc.exports) {
            this.rc.exports = {};
        }
    };


    /**
     * @function
     * @private
     * @member applyLogDefaults
     */
    applyLogDefaults = () =>
    {
        const rc = this.rc,
              pad = { base: 0, envTag: 25, value: 45, uploadFileName: 60 };
        rc.log = mergeIf(rc.log || {}, { level: 1, pad: { ...pad } });
        rc.logPad = mergeIf(rc.logPad || {}, { ...pad});
        rc.colors = mergeIf(rc.colors || {},
        {
            buildBracket: "blue",
            buildText: "white",
            default: "grey",
            infoIcon: "magenta",
            tagBracket: "blue",
            tagText: "white",
            uploadSymbol: "yellow",
            valueStar: "cyan",
            valueStarText: "white",
            builds: {
                main: "blue",
                tests: "white",
                types: "magenta",
                web: "cyan"
            }
        });
    };


    /**
     * @function
     * @private
     * @member applyPackageJson
     * @throws {WebpackError}
     */
    applyPackageJson = () =>
    {
        let pkgJsonPath = resolve(__dirname, "..", "..", "package.json");
        try
        {   if (existsSync(pkgJsonPath) || existsSync(pkgJsonPath = resolve(__dirname, "..", "..", "..", "package.json")))
            {
                const props = [ // needs to be in sync with the properties of `WpBuildPackageJson`
                    "author", "displayName", "name", "description", "main", "module", "publisher", "version"
                ];
                /** @type {WpBuildPackageJson} */
                const pkgJso = JSON.parse(readFileSync(pkgJsonPath, "utf8")),
                      pkgJsoPartial = pickBy(pkgJso, p => props.includes(p));
                merge(this.rc, {}, { pkgJson: pkgJsoPartial });
                merge(globalEnv, {}, { pkgJson: pkgJsoPartial });
            }
            else {
                throw new WebpackError("Could not locate package.json");
            }
        }
        catch (e) {
            throw new WebpackError("Could not parse package.json, check syntax: " + e.message);
        }
    };


    /**
     * @function
     * @private
     * @member applyProperties
     */
    applyProperties = () =>
    {
        const rc = this.rc;
        if (!rc.name) {
            rc.name = rc.pkgJson.name;
        }
        if (!rc.displayName) {
            rc.name = rc.pkgJson.displayName;
        }
        if (!rc.bannerName) {
            rc.bannerName = rc.displayName;
        }
        if (!rc.bannerNameDetailed) {
            rc.bannerNameDetailed = rc.bannerName;
        }
        if (!rc.version) {
            rc.version = rc.pkgJson.version;
        }
    };


    /**
     * @function
     * @private
     * @member applyPluginDefaults
     */
    applyPluginDefaults = () =>
    {
        if (!this.rc.plugins) {
            this.rc.plugins = {};
        }
    };


    /**
     * @function
     * @private
     * @member applyVsCodeDefaults
     */
    applyVsCodeDefaults = () =>
    {
        const rc = this.rc;
        if (!rc.vscode) {
            rc.vscode = /** @type {WebpackVsCodeBuild} */({});
        }
        mergeIf(rc.vscode, { webview: { apps: {}, baseDir: "" }});
        mergeIf(rc.vscode.webview, { apps: {}, baseDir: "" });
    };


    /**
     * @function
     * @private
     * @member applyWpBuildRc
     */
    applyWpBuildRc = () =>
    {
        let rcPath = resolve(__dirname, "..", ".wpbuildrc.json");
        try
        {   if (existsSync(rcPath) || existsSync(rcPath = resolve(__dirname, "..", "..", ".wpbuildrc.json")))
            {
                merge(this.rc, JSON.parse(readFileSync(rcPath, "utf8")));
            }
            else {
                throw new WebpackError("Could not locate .wpbuildrc.json");
            }
        }
        catch {
            throw new WebpackError("Could not parse .wpbuildrc.json, check syntax");
        }
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
     * @param {WebpackMode} mode Webpack command line args
     * @param {WpBuildEnvironment} env Webpack build environment
     */
    printBanner = (mode, env) =>
    {
        const logger = new WpBuildConsoleLogger(env);
        this.printLineSep(logger);
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        console.log(gradient("red", "cyan", "pink", "green", "purple", "blue").multiline(this.spmBanner(), {interpolation: "hsv"}));
        this.printLineSep(logger);
        logger.write(gradient("purple", "blue", "pink", "green", "purple", "blue").multiline(` Start ${this.rc.bannerNameDetailed} Webpack Build`));
        this.printLineSep(logger);
        logger.write("   Mode  : " + logger.withColor(mode, logger.colors.grey), 1, "", 0, logger.colors.white);
        logger.write("   Argv  : " + logger.withColor(JSON.stringify(env.argv), logger.colors.grey), 1, "", 0, logger.colors.white);
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
       (_____/|_|       | /       |_|   |_| (____/   ${this.rc.version}  \\/ /        |/  \\:(           \\/           
                        |/${this.rc.displayName.padStart(50 - this.rc.displayName.length)}`;
    };

}


module.exports = WpBuildApplication;

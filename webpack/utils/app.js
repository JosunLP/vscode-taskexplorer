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
     * @member
     * @private
     * @type {WpBuildEnvironment}
     */
    env;

    /**
     * @type {WpBuildAppRc}
     */
    rc;

    /**
     * @class WpBuildApplication
     * @param {WebpackMode} mode Webpack command line args
     * @param {Partial<WpBuildEnvironment>} env Webpack build environment
     * @throws {WebpackError}
     */
    constructor(mode, env)
    {
        const appRc = /** @type {WpBuildAppRc} */({});
        let rcPath = resolve(__dirname, "..", ".wpbuildrc.json"),
            pkgJsonPath = resolve(__dirname, "..", "..", "package.json");
        //
        // Read .wpbuildrc
        //
        try
        {   if (existsSync(rcPath) || existsSync(rcPath = resolve(__dirname, "..", "..", ".wpbuildrc.json")))
            {
                merge(appRc, JSON.parse(readFileSync(rcPath, "utf8")));
            }
            else {
                throw new WebpackError("Could not locate .wpbuildrc.json");
            }
        }
        catch {
            throw new WebpackError("Could not parse .wpbuildrc.json, check syntax");
        }

        //
        // Read package.json
        //
        try
        {   if (existsSync(pkgJsonPath) || existsSync(pkgJsonPath = resolve(__dirname, "..", "..", "..", "package.json")))
            {
                const props = [ // needs to be in sync with the properties of `WpBuildPackageJson`
                    "author", "displayName", "name", "description", "main", "module", "publisher", "version"
                ];
                /** @type {WpBuildPackageJson} */
                const pkgJso = JSON.parse(readFileSync(pkgJsonPath, "utf8")),
                    pkgJsoPartial = pickBy(pkgJso, p => props.includes(p));
                merge(appRc, {}, { pkgJson: pkgJsoPartial });
                merge(globalEnv, {}, { pkgJson: pkgJsoPartial });
            }
            else {
                throw new WebpackError("Could not locate package.json");
            }
        }
        catch (e) {
            throw new WebpackError("Could not parse package.json, check syntax: " + e.message);
        }

        if (!appRc.plugins) {
            appRc.plugins = {};
        }

        if (!appRc.exports) {
            appRc.exports = {};
        }

        //
        // PRIMITIVE PROPERTIES
        //
        if (!appRc.name) {
            appRc.name = appRc.pkgJson.name;
        }
        if (!appRc.displayName) {
            appRc.name = appRc.pkgJson.displayName;
        }
        if (!appRc.bannerName) {
            appRc.bannerName = appRc.displayName;
        }
        if (!appRc.bannerNameDetailed) {
            appRc.bannerNameDetailed = appRc.bannerName;
        }
        if (!appRc.version) {
            appRc.version = appRc.pkgJson.version;
        }

        //
        // VSCODE PROPERTIES
        //
        if (!appRc.vscode) {
            appRc.vscode = /** @type {WebpackVsCodeBuild} */({});
        }
        mergeIf(appRc.vscode, { webview: { apps: {}, baseDir: "" }});
        mergeIf(appRc.vscode.webview, { apps: {}, baseDir: "" });

        //
        // LOG PROPERTIES
        //
        const pad = { base: 0, envTag: 25, value: 45, uploadFileName: 60 };
        appRc.log = mergeIf(appRc.log || {}, { level: 1, pad: { ...pad } });
        appRc.logPad = mergeIf(appRc.logPad || {}, { ...pad});
        appRc.colors = mergeIf(appRc.colors || {}, {
            buildBracket: "blue", buildText: "white", default: "grey", infoIcon: "magenta", tagBracket: "blue",
            tagText: "white", uploadSymbol: "yellow", valueStar: "cyan", valueStarText: "white"
        });

        this.rc = appRc;
        this.env = /** @type {WpBuildEnvironment} */(env);
        this.printBanner(mode);
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
     * @param {WebpackMode} mode Webpack command line args
     */
    printBanner = (mode) =>
    {
        const logger = new WpBuildConsoleLogger(this.env);
        this.printLineSep(logger);
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        console.log(gradient("red", "cyan", "pink", "green", "purple", "blue").multiline(this.spmBanner(), {interpolation: "hsv"}));
        this.printLineSep(logger);
        logger.write(gradient("purple", "blue", "pink", "green", "purple", "blue").multiline(` Start ${this.rc.bannerNameDetailed} Webpack Build`));
        this.printLineSep(logger);
        logger.write("   Mode  : " + logger.withColor(mode, logger.colors.grey), 1, "", 0, logger.colors.white);
        logger.write("   Argv  : " + logger.withColor(JSON.stringify(this.env.argv), logger.colors.grey), 1, "", 0, logger.colors.white);
        logger.write("   Env   : " + logger.withColor(JSON.stringify(this.env), logger.colors.grey), 1, "", 0, logger.colors.white);
        this.printLineSep(logger);
    };


    // /**
    //  * @function
    //  * @private
    //  * @param {WpBuildConsoleLogger} logger
    //  * @returns {string}
    //  */
    // const spmBanner2 = (app, version) =>
    // {
    //     return `     ${icons.info}       ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________
    //      ${icons.info}      (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  )
    //      ${icons.info}      \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ /
    //      ${icons.info}    ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  /
    //      ${icons.info}   (_____/|_|       | /       |_|   |_| (____/   ${version}   \\/
    //      ${icons.info}                    |/${app.padStart(51 - app.length)}`;
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
       (_____/|_|       | /       |_|   |_| (____/   ${this.rc.version}  \\/ /        |/  \\:(           \\/           
                        |/${this.rc.displayName.padStart(50 - this.rc.displayName.length)}`;
    };

}


module.exports = WpBuildApplication;

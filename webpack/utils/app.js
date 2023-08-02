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
const { readFileSync, existsSync } = require("fs");
const { merge, pickBy, mergeIf } = require("./utils");
const { write, writeInfo, withColor, figures, colors } = require("./console");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPackageJson} WpBuildPackageJson */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackVsCodeBuild} WebpackVsCodeBuild */


class WpBuildApplication
{
    /**
     * @type {WpBuildApp}
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
        const appRc = /** @type {WpBuildApp} */({});
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
        appRc.logPad = mergeIf(appRc.logPad || {}, { envTag: 25, value: 45, uploadFileName: 60 });
        appRc.colors = mergeIf(appRc.colors || {}, {
            default: "grey", stageBracket: "cyan", stageText: "white",
            tagBracket: "blue", tagText: "white", uploadSymbol: "yellow"
        });

        this.rc = appRc;
        this.printBanner(mode, env);
    };


    printLineSep = () =>
    {
        writeInfo("------------------------------------------------------------------------------------------------------------------------");
    };


    /**
     * @function
     * @private
     * @param {WebpackMode} mode Webpack command line args
     * @param {Partial<WpBuildEnvironment>} env Webpack build environment
     */
    printBanner = (mode, env) =>
    {
        this.printLineSep();
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        console.log(gradient("red", "cyan", "pink", "green", "purple", "blue").multiline(this.spmBanner(), {interpolation: "hsv"}));
        this.printLineSep();
        write(gradient("purple", "blue", "pink", "green", "purple", "blue").multiline(` Start ${this.rc.bannerNameDetailed} Webpack Build`));
        this.printLineSep();
        write(withColor("   Mode  : ", colors.white) + withColor(mode, colors.grey));
        write(withColor("   Argv  : ", colors.white) + withColor(JSON.stringify(env.argv), colors.grey));
        write(withColor("   Env   : ", colors.white) + withColor(JSON.stringify(env), colors.grey));
        this.printLineSep();
    };


    // /**
    //  * @function
    //  * @param {string} app Application name
    //  * @param {string} version Application version
    //  * @returns {string}
    //  */
    // const spmBanner2 = (app, version) =>
    // {
    //     return `     ${figures.info}       ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________
    //      ${figures.info}      (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  )
    //      ${figures.info}      \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ /
    //      ${figures.info}    ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  /
    //      ${figures.info}   (_____/|_|       | /       |_|   |_| (____/   ${version}   \\/
    //      ${figures.info}                    |/${app.padStart(51 - app.length)}`;
    // };


    /**
     * @function
     * @private
     * @returns {string}
     */
    spmBanner = () =>
    {
        return `     ${figures.info}       ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________   ____/^\\.  __//\\.____ __   ____  _____
        ${figures.info}      (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  ) /  _^ | | / //\\ /  __\\:(  // __\\// ___)
        ${figures.info}      \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ / (  (_| | |/ /|_| | ___/\\\\ // ___/| //
        ${figures.info}    ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  / /^\\__\\__| |\\ \\--._/\\____ \\\\/\\\\___ |_|
        ${figures.info}   (_____/|_|       | /       |_|   |_| (____/   ${this.rc.version}  \\/ /        |/  \\:(           \\/           
        ${figures.info}                    |/${this.rc.displayName.padStart(50 - this.rc.displayName.length)}`;
    };

}

module.exports = WpBuildApplication;

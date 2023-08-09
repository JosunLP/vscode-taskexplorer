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
const { resolve } = require("path");
const gradient = require("gradient-string");
const WpBuildConsoleLogger = require("./console");
const { readFileSync, existsSync } = require("fs");
const { merge, pickBy, WpBuildError, findFiles, findFilesSync } = require("./utils");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildAppRc} WpBuildAppRc */
/** @typedef {import("../types").WpBuildLogLevel} WpBuildLogLevel */
/** @typedef {import("../types").WpBuildLogOptions} WpBuildLogOptions */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPackageJson} WpBuildPackageJson */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildVsCodeBuild} WebpackVsCodeBuild */
/** @typedef {import("../types").WpBuildLogColorMap} WpBuildLogColorMap */
/** @typedef {import("../types").WpBuildExportsFlags} WpBuildExportsFlags */
/** @typedef {import("../types").WpBuildPluginsFlags} WpBuildPluginsFlags */
/** @typedef {import("../types").WpBuildLogTrueColor} WpBuildLogTrueColor */
/** @typedef {import("../types").WpBuildModuleConfig} WpBuildModuleConfig */


/**
 * @class
 * @implements {WpBuildApp}
 */
class WpBuildApplication
{
    /**
     * @member {WpBuildAppRc}
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
        this.rc = env.app = merge({
            name: "",                    // project name (read from package.json)
            bannerName: "",              // Displayed in startup banner detail line
            bannerNameDetailed: "",      // Displayed in startup banner detail line
            displayName: "",             // displayName (read from package.json)
            publicInfoProject: false,    // Project w/ private repo that maintains a public `info` project
            version: "",                 // app version (read from package.json)
            builds: this.builds(),
            colors: this.colors(),
            log: this.log(),
            pkgJson: this.packageJson(),
            exports: this.exports(),
            plugins: this.plugins(),
            vscode: { webview: { apps: {}, baseDir: "" }}
        }, this.wpBuildRc());

        this.printBanner(mode, /** @type {WpBuildEnvironment} */(env));
    };


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildModuleConfig}
     */
    builds = () => ({ baseDir: ".", dev: {}, prod: {}, test: {}, testprod: {}});


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildLogColorMap}
     */
    colors = () => ({
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
            extension: "blue",
            tests: "white",
            types: "magenta",
            web: "cyan",
            webview: "cyan"
        }
    });


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildExportsFlags}
     */
    exports = () => ({
        cache: true,
        context: true,
        devtool: true,
        entry: true,
        experiments: true,
        externals: true,
        ignorewarnings: true,
        minification: false,
        mode: true,
        name: true,
        optimization: true,
        output: true,
        plugins: true,
        resolve: true,
        rules: true,
        stats: true,
        target: true,
        watch: true
    });


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildLogOptions}
     */
    log = () => ({
        level: 2,
        valueMaxLineLength: 100,
        pad: {
            base: 0,
            envTag: 24,
            value: 45,
            uploadFileName: 50
        }
    });


    /**
     * @function
     * @private
     * @member
     * @throws {WpBuildError}
     */
    packageJson = () =>
    {
        const pkgJson = {
            description: "",
            displayName: "",
            main: "",
            module: false,
            name: "",
            publisher: "",
            version: ""
        };
        let pkgJsonPath = resolve(__dirname, "..", "..", "package.json");
        if (existsSync(pkgJsonPath) || existsSync(pkgJsonPath = resolve(__dirname, "..", "..", "..", "package.json")))
        {
            try {
                merge(pkgJson, pickBy(JSON.parse(readFileSync(pkgJsonPath, "utf8")),
                    (p) => [  "author", "displayName", "name", "description", "main", "module", "publisher", "version" ].includes(p))
                );
            }
            catch (e) {
                throw new WpBuildError("Could not parse package.json, check syntax", "utils/app.js", e.message);
            }
        }
        else { throw new WpBuildError("Could not locate package.json", "utils/app.js"); }
        return pkgJson;
    };


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildPluginsFlags}
     */
    plugins = () => ({
        analyze: true,
        banner: true,
        build: false,
        clean: true,
        copy: true,
        environment: true,
        hash: false,
        html: true,
        ignore: true,
        istanbul: false,
        licensefiles: true,
        loghooks: true,
        optimization: true,
        progress: false,
        runtimevars: false,
        scm: false,
        sourcemaps: true,
        testsuite: false,
        tscheck: false,
        upload: false,
        vendormod: true,
        wait: false
    });


    /**
     * @function
     * @private
     * @member
     * @returns {WpBuildAppRc}
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
                throw new WpBuildError("Could not parse .wpbuildrc.json, check syntax", "utils/app.js", e.message);
            }
        }
        throw new WpBuildError("Could not locate .wpbuildrc.json", "utils/app.js");
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

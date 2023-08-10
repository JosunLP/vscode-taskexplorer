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
const { resolve, basename } = require("path");
const { WpBuildError, findFilesSync, apply } = require("./utils");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").IDisposable} IDisposable */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildRcLog} WpBuildRcLog */
/** @typedef {import("../types").WpBuildRcPaths} WpBuildRcPaths */
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
 * @implements {IDisposable}
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
     */
    constructor()
    {
        apply(this, WpBuildRc.wpBuildRc());
    };

    dispose = () => {};


    /**
     * @function
     * @private
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
                const rc = JSON5.parse(readFileSync(files[0], "utf8"));
                rc.pkgJson = this.packageJson();
                return rc;
            }
            catch (e) {
                throw new WpBuildError(`Could not parse wpbuild config file ${basename(files[0])}, check syntax`, "utils/app.js", e.message);
            }
        }
        throw new WpBuildError("Could not locate a wpbuild config file", "utils/app.js");
    };

}


module.exports = WpBuildRc;

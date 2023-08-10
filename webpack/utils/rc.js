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
const { readFileSync, existsSync } = require("fs");
const { resolve, basename, join, dirname } = require("path");
const { WpBuildError, findFilesSync, apply, pickBy, pick } = require("./utils");

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
    constructor() { apply(this, this.readWpBuildRc()); };


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
                throw new WpBuildError(`Could not locate or parse '${basename(file)}', check existence and syntax`, "utils/rc.js");
            }
            return this.find(file, parentDir, caller);
        }
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
              defRcPath = resolve("../types/.wpbuildrc.defaults.json");
        return apply(rcJson.data, { pkgJson: this.readPackageJson() }, JSON5.parse(readFileSync(defRcPath, "utf8")));
    };

}


module.exports = WpBuildRc;

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.utils.app
 */

const { resolve, isAbsolute, join } = require("path");
const { globalEnv } = require("./global");
const gradient = require("gradient-string");
const { WebpackError } = require("webpack");
const WpBuildConsoleLogger = require("./console");
const { readFileSync, existsSync, writeFileSync } = require("fs");
const { merge, pickBy, mergeIf, clone } = require("./utils");
const { access, readFile, writeFile } = require("fs/promises");

/** @typedef {import("../types").WpBuildRc} WpBuildRc */
/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackMode} WebpackMode */
/** @typedef {import("../types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */


/**
 * @class
 */
class WpBuildCache
{
    /**
     * @member
     * @private
     * @type {Record<string, any>}
     */
    cache;

    /**
     * @member
     * @private
     * @type {WpBuildApp}
     */
    app;

    /**
     * @member
     * @private
     * @type {string}
     */
    file;


    /**
     * @class WpBuildApplication
     * @param {WpBuildApp} app Webpack build environment
     * @param {string} file Filename to read/write cache to
     * @throws {WebpackError}
     */
    constructor(app, file)
    {
        this.app = app;
        if (!isAbsolute(file)) {
            this.file = resolve(this.app.global.cacheDir, file);
        }
        this.cache = this.read();
    }


    /**
     * @function
     * @returns {Record<string, any>}
     */
    get = () => merge({}, this.cache);


    /**
     * @function
     * @param {string} item
     * @returns {any}
     */
    getItem = (item) => clone(this.cache[item]);


    /**
     * @function
     * @returns {Record<string, any>}
     */
    read = () =>
    {
        let jso;
        if (!existsSync(this.file)) {
            writeFileSync(this.file, "{}");
        }
        try {
            jso = JSON.parse(readFileSync(this.file, "utf8"));
        }
        catch (e) { jso = {}; }
        return jso;
    };


    /**
     * @function
     */
    save = () => writeFileSync(this.file, JSON.stringify(this.cache));


    /**
     * @function
     */
    saveAsync = () => writeFile(this.file, JSON.stringify(this.cache));


    /**
     * @function
     * @param {Record<string, any>} cache The cache, as a JSON object
     */
    set = (cache) => { this.cache = merge({}, cache); this.save(); };


    /**
     * @function
     * @param {Record<string, any>} cache The cache, as a JSON object
     */
    setAsync = (cache) => { this.cache = merge({}, cache); return this.saveAsync(); };

}


module.exports = WpBuildCache;

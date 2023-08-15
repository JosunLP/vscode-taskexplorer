// @ts-check

/**
 * @file utils/constants.js
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 *
 * This file was auto generated using the 'generate-wpbuild-types' script together with
 * the 'json-to-typescript' utility
 */

const typedefs = require("../types/typedefs");

/**
 * @type {typedefs.WebpackMode[]}
 */
const WebpackModes = [ "development", "none", "production" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WebpackMode}
 */
const isWebpackMode = (v) => !!v && WebpackModes.includes(v);

/**
 * @type {typedefs.WpBuildRcBuildType[]}
 */
const WpBuildRcBuildTypes = [ "module", "tests", "types", "webapp", "webmodule" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildRcBuildType}
 */
const isWpBuildRcBuildType = (v) => !!v && WpBuildRcBuildTypes.includes(v);

/**
 * @type {typedefs.WpBuildWebpackMode[]}
 */
const WpBuildWebpackModes = [ "development", "production", "none", "test", "testproduction" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildWebpackMode}
 */
const isWpBuildWebpackMode = (v) => !!v && WpBuildWebpackModes.includes(v);

/**
 * @type {typedefs.WebpackTarget[]}
 */
const WebpackTargets = [ "node", "web", "webworker", "async-node", "node-webkit", "electron-main", "electron-renderer", "electron-preload", "nwjs", "esX", "browserlist" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WebpackTarget}
 */
const isWebpackTarget = (v) => !!v && WebpackTargets.includes(v);

/**
 * @type {typedefs.WpBuildLogTrueColor[]}
 */
const WpBuildLogTrueColors = [ "black", "blue", "cyan", "green", "grey", "magenta", "red", "system", "white", "yellow" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildLogTrueColor}
 */
const isWpBuildLogTrueColor = (v) => !!v && WpBuildLogTrueColors.includes(v);

/**
 * @type {typedefs.WpBuildLogColor[]}
 */
const WpBuildLogColors = [ "black", "blue", "cyan", "green", "grey", "magenta", "red", "system", "white", "yellow", "bold", "inverse", "italic", "underline" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildLogColor}
 */
const isWpBuildLogColor = (v) => !!v && WpBuildLogColors.includes(v);

/**
 * @type {(keyof typedefs.WpBuildRcPaths)[]}
 */
const WpBuildRcPathsProps = [ "ctx", "dist", "src", "srcTests", "srcTypes", "srcWebApp", "tsconfig" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildRcPaths}
 */
const isWpBuildRcPathsProp = (v) => !!v && WpBuildRcPathsProps.includes(v);

/**
 * @type {(keyof typedefs.WpBuildRcPackageJson)[]}
 */
const WpBuildRcPackageJsonProps = [ "author", "description", "displayName", "main", "module", "name", "publisher", "version" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildRcPackageJson}
 */
const isWpBuildRcPackageJsonProp = (v) => !!v && WpBuildRcPackageJsonProps.includes(v);


module.exports = {
    isWebpackMode ,
    isWebpackTarget ,
    isWpBuildLogColor ,
    isWpBuildLogTrueColor ,
    isWpBuildRcBuildType ,
    isWpBuildRcPackageJsonProp ,
    isWpBuildRcPathsProp ,
    isWpBuildWebpackMode ,
    WebpackModes,
    WebpackTargets,
    WpBuildLogColors,
    WpBuildLogTrueColors,
    WpBuildRcBuildTypes,
    WpBuildRcPackageJsonProps,
    WpBuildRcPathsProps,
    WpBuildWebpackModes
};

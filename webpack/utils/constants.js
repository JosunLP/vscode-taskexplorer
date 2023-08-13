/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/constants.js
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 *
 * This file was auto generated using the 
 */

/** @typedef {import("../types").WebpackTarget} WebpackTarget */
/** @typedef {import("../types").WpBuildLogColor} WpBuildLogColor */
/** @typedef {import("../types").WpBuildRcBuildType} WpBuildRcBuildType */
/** @typedef {import("../types").WpBuildWebpackMode} WpBuildWebpackMode */
/** @typedef {import("../types").WpBuildLogTrueColor} WpBuildLogTrueColor */

/**
 * @type {WpBuildRcBuildType[]}
 */
const WpBuildRcBuildTypes = [ "module", "tests", "types", "webapp", "webmodule" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is WpBuildRcBuildType}
 */
const isWpBuildRcBuildType = (v) => !!v && WpBuildRcBuildTypes.includes(v);

/**
 * @type {WpBuildWebpackMode[]}
 */
const WpBuildWebpackModes = [ "development", "production", "none", "test", "testproduction" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is WpBuildWebpackMode}
 */
const isWpBuildWebpackMode = (v) => !!v && WpBuildWebpackModes.includes(v);

/**
 * @type {WebpackTarget[]}
 */
const WebpackTargets = [ "node", "web", "webworker", "async-node", "node-webkit", "electron-main", "electron-renderer", "electron-preload", "nwjs", "esX", "browserlist" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is WebpackTarget}
 */
const isWebpackTarget = (v) => !!v && WebpackTargets.includes(v);

/**
 * @type {WpBuildLogTrueColor[]}
 */
const WpBuildLogTrueColors = [ "black", "blue", "cyan", "green", "grey", "magenta", "red", "system", "white", "yellow" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is WpBuildLogTrueColor}
 */
const isWpBuildLogTrueColor = (v) => !!v && WpBuildLogTrueColors.includes(v);

/**
 * @type {WpBuildLogColor[]}
 */
const WpBuildLogColors = [ "black", "blue", "cyan", "green", "grey", "magenta", "red", "system", "white", "yellow", "bold", "inverse", "italic", "underline" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is WpBuildLogColor}
 */
const isWpBuildLogColor = (v) => !!v && WpBuildLogColors.includes(v);


module.exports = {
    isWebpackTarget,
    isWpBuildLogColor,
    isWpBuildLogTrueColor,
    isWpBuildRcBuildType,
    isWpBuildWebpackMode,
    WebpackTargets,
    WpBuildLogColors,
    WpBuildLogTrueColors,
    WpBuildRcBuildTypes,
    WpBuildWebpackModes
};

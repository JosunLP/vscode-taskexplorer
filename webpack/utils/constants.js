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

/** @typedef {import("../types").WpBuildLogColor} WpBuildLogColor */
/** @typedef {import("../types").WpBuildRcBuildType} WpBuildRcBuildType */
/** @typedef {import("../types").WpBuildWebpackMode} WpBuildWebpackMode */
/** @typedef {import("../types").WpBuildLogTrueColor} WpBuildLogTrueColor */

/**
 * @type {WpBuildRcBuildType[]}
 */
const WpBuildRcBuildTypes = [ "module", "tests", "types", "webapp", "webmodule" ];

/**
 * @type {WpBuildWebpackMode[]}
 */
const WpBuildWebpackModes = [ "development", "production", "none", "test", "testproduction" ];

/**
 * @type {WpBuildLogTrueColor[]}
 */
const WpBuildLogTrueColors = [ "black", "blue", "cyan", "green", "grey", "magenta", "red", "system", "white", "yellow" ];

/**
 * @type {WpBuildLogColor[]}
 */
const WpBuildLogColors = [ "black", "blue", "cyan", "green", "grey", "magenta", "red", "system", "white", "yellow", "bold", "inverse", "italic", "underline" ];


module.exports = {
    WpBuildRcBuildTypes,
    WpBuildWebpackModes,
    WpBuildLogTrueColors,
    WpBuildLogColors
};

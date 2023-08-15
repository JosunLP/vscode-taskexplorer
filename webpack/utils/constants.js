/* eslint-disable no-unused-labels */
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
 * @type {enum keyof WebpackModes}
 */
const WebpackModesEnum
{
"development" | "none" | "production"
};

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
 * @type {enum keyof WpBuildRcBuildTypes}
 */
const WpBuildRcBuildTypesEnum
{
"module" | "tests" | "types" | "webapp" | "webmodule"
};

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
 * @type {enum keyof WpBuildWebpackModes}
 */
const WpBuildWebpackModesEnum
{
"development" | "production" | "none" | "test" | "testproduction"
};

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
 * @type {enum keyof WebpackTargets}
 */
const WebpackTargetsEnum
{
"node" | "web" | "webworker" | "async-node" | "node-webkit" | "electron-main" | "electron-renderer" | "electron-preload" | "nwjs" | "esX" | "browserlist"
};

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
 * @type {enum keyof WpBuildLogTrueColors}
 */
const WpBuildLogTrueColorsEnum
{
"black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow"
};

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
 * @type {enum keyof WpBuildLogColors}
 */
const WpBuildLogColorsEnum
{
"black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow" | "bold" | "inverse" | "italic" | "underline"
};

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildLogColor}
 */
const isWpBuildLogColor = (v) => !!v && WpBuildLogColors.includes(v);

/**
 * @type {(keyof typedefs.WpBuildRcPaths)[]}
 */
const WpBuildRcPathsProps = [ "base", "ctx", "dist", "distTests", "src", "srcModule", "srcTests", "srcTypes", "srcWebApp", "srcWebModule", "tsconfig" ];

/**
 * @type {enum keyof WpBuildRcPathsProps}
 */
const WpBuildRcPathsPropsEnum
{
"base", "ctx", "dist", "distTests", "src", "srcModule", "srcTests", "srcTypes", "srcWebApp", "srcWebModule", "tsconfig"
};

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
 * @type {enum keyof WpBuildRcPackageJsonProps}
 */
const WpBuildRcPackageJsonPropsEnum
{
"author", "description", "displayName", "main", "module", "name", "publisher", "version"
};

/**
 * @param {any} v Variable to check type on
 * @returns {v is typedefs.WpBuildRcPackageJson}
 */
const isWpBuildRcPackageJsonProp = (v) => !!v && WpBuildRcPackageJsonProps.includes(v);


module.exports = {
    isWebpackMode,
    isWebpackTarget,
    isWpBuildLogColor,
    isWpBuildLogTrueColor,
    isWpBuildRcBuildType,
    isWpBuildRcPackageJsonProp,
    isWpBuildRcPathsProp,
    isWpBuildWebpackMode,
    WebpackModes,
    WebpackModesEnum,
    WebpackTargets,
    WebpackTargetsEnum,
    WpBuildLogColors,
    WpBuildLogColorsEnum,
    WpBuildLogTrueColors,
    WpBuildLogTrueColorsEnum,
    WpBuildRcBuildTypes,
    WpBuildRcBuildTypesEnum,
    WpBuildRcPackageJsonProps,
    WpBuildRcPackageJsonPropsEnum,
    WpBuildRcPathsProps,
    WpBuildRcPathsPropsEnum,
    WpBuildWebpackModes,
    WpBuildWebpackModesEnum
};

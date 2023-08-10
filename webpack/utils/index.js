/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const WpBuildApp = require("./app");
const WpBuildCache = require("./cache");
const WpBuildConsoleLogger = require("./console");

const {
    apply, asArray, clone, getTsConfig, merge, mergeIf, isArray, isDate, isEmpty, isFunction,
    isObject, isObjectEmpty, isPrimitive, isPromise, isString, pick, pickBy, pickNot, findFiles,
    findFilesSync, WpBuildError
} = require("./utils");

module.exports = {
    apply, asArray, clone, WpBuildApp, findFiles, findFilesSync, getTsConfig, isArray, isDate,
    isEmpty, isFunction, isObject, isObjectEmpty, isPrimitive, isPromise, isString, merge, mergeIf,
    pick, pickBy, pickNot, WpBuildCache, WpBuildConsoleLogger, WpBuildError
};

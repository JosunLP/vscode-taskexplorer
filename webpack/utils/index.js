/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const WpBuildCache = require("./cache");
const { globalEnv } = require("./global");
const environment = require("./environment");
const WpBuildApplication = require("./app");
const WpBuildConsoleLogger = require("./console");

const app = WpBuildApplication; // alias WpBuildApplication
const {
    apply, asArray, clone, getTsConfig, merge, mergeIf, isArray, isDate, isEmpty, isFunction,
    isObject, isObjectEmpty, isPrimitive, isPromise, isString, pick, pickBy, pickNot, findFiles,
    findFilesSync, WpBuildError
} = require("./utils");

module.exports = {
    app, apply, asArray, clone, environment, findFiles, findFilesSync, getTsConfig, globalEnv,
    isArray, isDate, isEmpty, isFunction, isObject, isObjectEmpty, isPrimitive, isPromise, isString,
    merge, mergeIf, pick, pickBy, pickNot, WpBuildCache, WpBuildConsoleLogger, WpBuildError
};

/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const WpBuildCache = require("./cache");
const { globalEnv } = require("./global");
const WpBuildApplication = require("./app");
const app = WpBuildApplication; // alias WpBuildApplication
const environment = require("./environment");
const WpBuildConsoleLogger = require("./console");
const {
    apply, asArray, clone, getTsConfig, merge, mergeIf, isArray, isDate, isEmpty, isFunction,
    isObject, isObjectEmpty, isPrimitive, isPromise, isString, pick, pickBy, pickNot, findFiles
} = require("./utils");

module.exports = {
    app, apply, asArray, clone, environment, findFiles, getTsConfig, globalEnv, isArray, isDate,
    isEmpty, isFunction, isObject, isObjectEmpty, isPrimitive, isPromise, isString, merge, mergeIf,
    pick, pickBy, pickNot, WpBuildCache, WpBuildConsoleLogger
};

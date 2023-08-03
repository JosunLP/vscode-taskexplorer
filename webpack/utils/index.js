/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { globalEnv } = require("./global");
const WpBuildApplication = require("./app");
const app = WpBuildApplication; // alias WpBuildApplication
const environment = require("./environment");
const WpBuildConsoleLogger = require("./console");
const {
    apply, asArray, clone, merge, mergeIf, isArray, isDate, isEmpty, isObject, isObjectEmpty,
    isString, getEntriesRegex, pick, pickBy, pickNot
} = require("./utils");

module.exports = {
    app, apply, asArray, clone, environment, getEntriesRegex, globalEnv, isArray, isDate, isEmpty,
    isObject, isObjectEmpty, isString, merge, mergeIf, pick, pickBy, pickNot, WpBuildConsoleLogger
};

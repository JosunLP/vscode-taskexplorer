/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check


const WpBuildApplication = require("./app");
const { globalEnv } = require("./global");
const environment = require("./environment");
const { colors, figures, tagColor, withColor, withColorLength, write, writeInfo } = require("./console");
const {
    apply, asArray, clone, merge, mergeIf, isArray, isDate, isEmpty, isObject, isObjectEmpty,
    isString, getEntriesRegex, pick, pickBy, pickNot
} = require("./utils");

const app = WpBuildApplication; // alias WpBuildApplication

module.exports = {
    app, apply, asArray, clone, colors, environment, figures, getEntriesRegex, globalEnv, isArray,
    isDate, isEmpty, isObject, isObjectEmpty, isString, merge, mergeIf, pick, pickBy, pickNot,
    tagColor, withColor, withColorLength, write,  writeInfo
};

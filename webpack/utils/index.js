// @ts-check


const { globalEnv } = require("./global");
const environment = require("./environment");
const { colors, figures, withColor, withColorLength, write, writeInfo } = require("./console");
const {
    apply, asArray, clone, merge, mergeIf, printBanner, readConfigFiles, initGlobalEnvObject, isArray,
    isDate, isEmpty, isObject, isObjectEmpty, isString, getEntriesRegex, pick, pickBy, pickNot,
    printLineSep, tapStatsPrinter
} = require("./utils");

module.exports = {
    apply, asArray, clone, colors, environment, figures, getEntriesRegex, globalEnv, initGlobalEnvObject,
    isArray, isDate, isEmpty, isObject, isObjectEmpty, isString, merge, mergeIf, pick, pickBy, pickNot,
    printBanner, printLineSep, readConfigFiles, tapStatsPrinter, withColor, withColorLength, write,  writeInfo
};

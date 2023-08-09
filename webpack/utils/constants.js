/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WpBuildBuildEnvironment} WpBuildBuildEnvironment */

/**
 * @type {WpBuildModule[]}
 */
const WpBuildModuleTypes = [ "web" , "common", "extension", "tests", "types", "webview" ];

/**
 * @type {WpBuildBuildEnvironment[]}
 */
const WpBuildBuildEnvironmentTypes = [ "dev" , "prod", "test", "testprod" ];

module.exports = {
    WpBuildModuleTypes, WpBuildBuildEnvironmentTypes
};

/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

/**
 * @type {WpBuildModule[]}
 */
const WpBuildModuleTypes = [ "web" , "extension", "tests", "types", "webview" ];

/**
 * @type {WpBuildEnvironment[]}
 */
const WpBuildBuildEnvironmentTypes = [ "dev" , "prod", "test", "testprod" ];

module.exports = {
    WpBuildModuleTypes, WpBuildBuildEnvironmentTypes
};

const RegexTestsChunk = (/[a-z]+\.(?:tests?|specs?)$|[\/\\]tests?|suite[\/\\]/i);


module.exports = {
    RegexTestsChunk
};

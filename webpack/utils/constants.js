/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/** @typedef {import("../types").WpBuildWebpackMode} WpBuildWebpackMode */
// @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


// /**
//  * @type {WpBuildModule[]}
//  */
// const WpBuildModuleTypes = [ "web" , "extension", "tests", "types", "webapp" ];

/**
 * @type {WpBuildWebpackMode[]}
 */
const WpBuildBuildEnvironmentTypes = [ "development" , "production", "test", "testproduction" ];

const RegexTestsChunk = (/[a-z]+\.(?:tests?|specs?)$|[\/\\]tests?|suite[\/\\]/i);


module.exports = {
    RegexTestsChunk,
    /* WpBuildModuleTypes */ WpBuildBuildEnvironmentTypes
};

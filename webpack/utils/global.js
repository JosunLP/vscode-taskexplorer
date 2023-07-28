// @ts-check

/**
 * @module webpack.global
 */

/** @typedef {import("../types").WebpackGlobalEnvironment} WebpackGlobalEnvironment */

/** @type {WebpackGlobalEnvironment} */
const globalEnv = {
    buildCount: 0,
    valuePad: 46,
    pkgJson: {}
};

module.exports = globalEnv;

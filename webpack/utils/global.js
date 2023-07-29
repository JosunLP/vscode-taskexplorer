// @ts-check

/**
 * @module webpack.global
 */

/** @typedef {import("../types").WebpackPackageJson} WebpackPackageJson */
/** @typedef {import("../types").WebpackGlobalEnvironment} WebpackGlobalEnvironment */

/** @type {WebpackGlobalEnvironment} */
const globalEnv = {
    buildCount: 0,
    valuePad: 45,
    pkgJson: /** @type {WebpackPackageJson} */({})
};

module.exports = globalEnv;

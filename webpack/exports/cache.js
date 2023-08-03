// @ts-check

/**
 * @module wpbuild.exports.cache
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const cache = (env) =>
{
	env.wpc.cache = {
        type: "memory",
        maxGenerations: Infinity,
        cacheUnaffected: true
    };
};


module.exports = cache;

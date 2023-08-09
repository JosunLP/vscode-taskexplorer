// @ts-check

/**
 * @module wpbuild.exports.cache
 */

/** @typedef {import("../types").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const cache = (app) =>
{
	app.wpc.cache = {
        type: "memory",
        maxGenerations: Infinity,
        cacheUnaffected: true
    };
};


module.exports = cache;

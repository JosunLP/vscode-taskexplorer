// @ts-check

/**
 * @file exports/cache.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { WpBuildApp } = require("../utils");


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const cache = (app) =>
{
	if (app.rc.exports.cache)
	{
		app.wpc.cache = {
            type: "memory",
            maxGenerations: Infinity,
            cacheUnaffected: true
        };
    }
};


module.exports = cache;

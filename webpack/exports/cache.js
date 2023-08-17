// @ts-check

/**
 * @file exports/cache.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { join } = require("path");
const { WpBuildApp } = require("../utils");


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const cache = (app) =>
{
	if (app.rc.exports.cache)
	{
        const basePath = app.getRcPath("base");
		app.wpc.cache = {
            type: "filesystem",
            cacheDirectory: join(basePath, "node_modules", ".cache", "wpbuild", "webpack"),
            name: `${app.build.name}_${app.build.type}_${app.wpc.target}`.toLowerCase(),
            version: app.rc.pkgJson.version, // `${process.env.GIT_REV}`
            buildDependencies:
            {
                defaultWebpack: [ "webpack/lib/" ],
                config: [
                    join(basePath, "webpack.config.js")
                ]
            }
        };
    }
    else {
        app.wpc.cache = {
            type: "memory",
            maxGenerations: Infinity,
            cacheUnaffected: true
        };
    }
};


module.exports = cache;

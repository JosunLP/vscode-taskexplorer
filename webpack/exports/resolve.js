/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { join } = require("path");
const { apply } = require("../utils");

/** @typedef {import("../types/typedefs").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const resolve = (app) =>
{
	const typesPath = app.getRcPath("srcTypes") || join(app.getRcPath("base"), "types"),
		  envPath = join((app.getRcPath("srcEnv") || join(app.getRcPath("src"), "lib", "env")), app.target);

    app.wpc.resolve = {
		alias: {
			":env": envPath,
			":types": typesPath
		},
		extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
	};

	if (app.build.type !== "webapp")
	{
		apply(app.wpc.resolve,
		{
			mainFields: app.isWeb ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.isWeb ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined
		});
	}
	else {
		apply(app.wpc.resolve, { modules: [ app.getRcPath("ctx"), "node_modules" ]});
	}
};


module.exports = resolve;

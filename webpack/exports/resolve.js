/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { join } = require("path");
const { apply, merge, findFilesSync, isArray, WpBuildApp } = require("../utils");


/**
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const resolve = (app) =>
{
	apply(app.wpc.resolve,
	{   // app.getAliasConfig() will map `tsconfig.paths` and `[buildrc].alias`
		alias: merge({}, app.build.alias),
		extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
	});


	if (app.build.type !== "webapp")
	{
		apply(app.wpc.resolve,
		{
			mainFields: app.isWeb ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.isWeb ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined
		});
	}
	else {
		apply(app.wpc.resolve, { modules: [ app.getContextPath(), "node_modules" ]});
	}




app.wpc.resolve = {
	modules: [ app.getContextPath(), "node_modules" ],
	extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
	alias: {
		":env": [ join(app.build.paths.base, "src", "lib", "env", app.target) ],
		":types": [ join(app.build.paths.base, "types") ]
	}
};


};


module.exports = resolve;

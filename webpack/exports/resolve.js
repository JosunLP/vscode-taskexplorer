/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { apply, merge, findFilesSync, isArray, WpBuildApp } = require("../utils");


/**
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const resolve = (app) =>
{
	const basePath = app.getRcPath("base"),
		  srcPath = app.getSrcPath({ rel: true, psx: true }),
		  envGlob = `**/${srcPath}/**/{env,environment,target}/${app.target}/`,
		  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });

	const resolve = {
		alias: merge({}, app.getAliasConfig()),
		extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
	};

	if (envDirs.length >= 0)
	{
		envDirs.forEach((dir) =>
		{
			if (isArray(resolve.alias[":env"]))
			{
				if (!resolve.alias[":env"].includes(dir)) {
					resolve.alias[":env"].push(dir);
				}
			}
			else {
				resolve.alias[":env"] = [ dir ];
			}
		});
	}

	if (app.build.type !== "webapp")
	{
		apply(resolve,
		{
			mainFields: app.isWeb ? [ "web", "module", "main" ] : [ "module", "main" ],
			fallback: app.isWeb ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined
		});
	}
	else {
		apply(resolve, { modules: [ app.getContextPath(), "node_modules" ]});
	}

	app.wpc.resolve = resolve;
};


module.exports = resolve;

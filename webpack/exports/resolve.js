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
	apply(app.wpc.resolve,
	{   // app.getAliasConfig() will map `tsconfig.paths` and `[buildrc].alias`
		alias: merge({}, app.getAliasConfig()),
		extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
	});

	const alias = app.wpc.resolve.alias;
	if (!alias[":env"])
	{
		const basePath = app.getRcPath("base"),
			  srcPath = app.getSrcPath({ rel: true, psx: true }),
			  envGlob = `**/${srcPath}/**/{env,environment,target}/${app.target}/`,
			  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
		if (envDirs.length >= 0)
		{
			envDirs.forEach((dir) =>
			{
				if (isArray(alias[":env"]))
				{
					if (!alias[":env"].includes(dir)) {
						alias[":env"].push(dir);
					}
				}
				else {
					alias[":env"] = [ dir ];
				}
			});
		}
	}

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
};


module.exports = resolve;

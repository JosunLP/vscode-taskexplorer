/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const { apply, merge, isObjectEmpty, findFilesSync, WebpackTargets, getTsConfig } = require("../utils");

/** @typedef {import("../types/typedefs").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const resolve = (app) =>
{
	const aliasMap = {},
		  typesPath = app.getSrcTypesPath(),
		  envPath = app.getSrcEnvPath(),
		  basePath = app.getRcPath("base"),
		  aliases = app.getAliasObject(),
		  srcPath = app.getSrcPath({ rel: true, psx: true }),
		  envGlob = `**/${srcPath}/**/{env,environment,target}/${app.target}/`,
		  envDirs= findFilesSync(envGlob, { cwd: basePath, absolute: false, dotRelative: false }),
		  tsConfig = getTsConfig(app);

	if (envDirs.length >= 0)
	{
		envDirs.forEach((dir) =>
		{
			if (aliasMap[":env"])
			{
				if (!aliasMap[":env"].includes(dir)) {
					aliasMap[":env"].push(dir);
				}
			}
			else {
				aliasMap[":env"] = [ dir ];
			}
		});
	}

	if (tsConfig && tsConfig.json.compilerOptions?.alias)
	{
		Object.entries(tsConfig.json.compilerOptions.alias).map(e => [ e[0].replace(/[\\\/]\*{0,1}$/g, "") , e[1].replace(/[\\\/]\*{0,1}$/g, "") ]).forEach(([ key, path ]) =>
		{
			if (!aliasMap[key]) {
				aliasMap[key] = [ path ];
			}
			else {
				if (aliasMap[key].includes(path)) {
					app.logger.warning("tsconfig alias extractions share same key/value");
				}
				else {
					aliasMap[key].push(path);
				}
			}
		});
	}

    app.wpc.resolve = {
		alias: merge({
			":env": [
				envPath
			],
			":types": typesPath
		}, aliasMap, aliases),
		extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
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
		apply(app.wpc.resolve, { modules: [ app.getContextPath(), "node_modules" ]});
	}
};


module.exports = resolve;

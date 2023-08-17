/// @ts-check

/**
 * @file exports/resolve.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const { isAbsolute, dirname } = require("path");
const resolvePath = require("path").resolve;
const { apply, merge, isObjectEmpty, findFilesSync, WebpackTargets, getTsConfig, isArray } = require("../utils");

/** @typedef {import("../types/typedefs").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const resolve = (app) =>
{
	const typesSrcPath = app.getSrcTypesPath({ fstat: true }),
		  // typesDistPath = app.getRcPath("distTypes", { stat: true }),
		  envPath = app.getSrcEnvPath(),
		  basePath = app.getRcPath("base"),
		  srcPath = app.getSrcPath({ rel: true, psx: true }),
		  envGlob = `**/${srcPath}/**/{env,environment,target}/${app.target}/`,
		  envDirs= findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false }),
		  tsConfig = getTsConfig(app);

	const resolve = {
		alias: app.getAliasObject(),
		extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
	};

	if (envPath) {
		apply(resolve.alias, { ":env": [ envPath ] });
	}

	if (typesSrcPath) {
		apply(resolve.alias, { ":types": typesSrcPath });
	}

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

	if (tsConfig && tsConfig.json.compilerOptions?.paths)
	{
		const _map = (e) => e.map ((e) => [ e[0].replace(/[\\\/]\*{0,1}$/g, "") , e[1].map(e => e.replace(/[\\\/]\*{0,1}$/g, "")) ]);
		_map(Object.entries(tsConfig.json.compilerOptions.paths)).forEach(([ key, paths ]) =>
		{
			if (isArray(paths))
			{
				const v = resolve.alias[key];
				paths.forEach((p) =>
				{
					if (!isAbsolute(p)) {
						p = resolvePath(dirname(tsConfig.path), p);
					}
					if (isArray(v))
					{
						if (v.includes(p)) {
							app.logger.warning("tsconfig alias extractions share same key/value");
						}
						else {
							v.push(p);
						}
					}
					else {
						resolve.alias[key] = [ p ];
					}

				});
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

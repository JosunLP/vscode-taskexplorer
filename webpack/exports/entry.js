// @ts-check

/**
 * @file plugin/entry.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const { glob } = require("glob");
const { extname, isAbsolute, relative, basename } = require("path");
const typedefs = require("../types/typedefs");
const { apply, WpBuildError, merge, isObjectEmpty, isObject, isString, WpBuildApp } = require("../utils");


const globTestSuiteFiles= `**/*.{test,tests,spec,specs}.ts`;


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 */
	module: (app) =>
	{
		const srcPath = app.getSrcPath({ build: app.build.name, rel: true, ctx: true, dot: true, psx: true });
		apply(app.wpc.entry,
		{
			[app.build.name]: {
				import: `${srcPath}/${app.build.name}.ts`
			}
		});
		if (app.build.debug)
		{
			/** @type {typedefs.WpBuildWebpackEntryObject} */
			(app.wpc.entry[app.build.name]).layer = "release";
			apply(app.wpc.entry,
			{
				[`${app.build.name}.debug`]:
				{
					import: `${srcPath}/${app.build.name}.ts`,
					layer: "debug"
				}
			});
		}
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @throws {WpBuildError}
	 */
	tests: (app) =>
	{
		const testsPath = app.getSrcPath({ build: app.build.name, stat: true });
		if (testsPath)
		{
			app.wpc.entry = {};
			apply(app.wpc.entry, {
				...builds.testRunner(testsPath),
				...builds.testSuite(testsPath)
			});
			if (app.hasTypes())
			{
				const typesPath = app.getDistPath({ build: "types" });
				if (!existsSync(typesPath))
				{
					const typesApp = app.getApp("types");
					if (!typesApp)  {
						throw WpBuildError.getErrorProperty("types entry", "exports/entry.js", app.wpc);
					}
					Object.values(app.wpc.entry).forEach((/** @type {typedefs.WpBuildWebpackEntryObject} */e) =>
					{
						e.dependOn = typesApp.build.name;
					});
					builds.types(typesApp);
				}
			}
		}
	},


	/**
	 * @function
	 * @private
	 * @param {string} testsPathAbs
	 */
	testRunner: (testsPathAbs) =>
	{
		return glob.sync(
			`**/*.ts`, {
				absolute: false, cwd: testsPathAbs, dotRelative: false, posix: true, ignore: [ globTestSuiteFiles ]
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(".ts", "")] = {
				import: `./${e}`
			};
			return obj;
		}, {});
	},


	/**
	 * @function
	 * @private
	 * @param {string} testsPathAbs
	 */
	testSuite: (testsPathAbs) =>
	{
		return glob.sync(
			globTestSuiteFiles, {
				absolute: false, cwd: testsPathAbs, dotRelative: false, posix: true
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(".ts", "")] = { import: `./${e}`, dependOn: "runTest" };
			return obj;
		}, {});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 */
	types: (app) =>
	{
		const typesPath = app.getSrcPath({ build: app.build.name, rel: true, ctx: true, dot: true, psx: true });
		if (typesPath)
		{
			apply(app.wpc.entry, {
				[ app.build.name ]: `${typesPath}/${app.build.name}.ts`
			});
		}
	}


	// /**
	//  * @function
	//  * @private
	//  * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	//  */
	// webapp: (app) =>
	// {
	// 	app.wpc.entry = apply({}, app.vscode.webview.apps);
	// }

};


/**
 * @function
 * @private
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 * @param {string} file
 * @param {Partial<typedefs.EntryObject|typedefs.WpBuildWebpackEntry>} xOpts
 * @throws {WpBuildError}
 */
const addEntry = (app, file, xOpts) =>
{
	const ext = extname(file),
		  chunkName = basename(file).replace(new RegExp(`${ext}$`), "");

	let relPath = (!isAbsolute(file) ? file : relative(app.wpc.context, file)).replace(/\\/g, "/");
	if (!relPath.startsWith("./")) {
		relPath = "./" + relPath;
	}

	apply(app.wpc.entry,
	{
		[chunkName]: {
			import: `${relPath}/${chunkName}.${ext}`
		}
	});

	if (app.build.debug)
	{
		/** @type {typedefs.WpBuildWebpackEntryObject} */
		(app.wpc.entry[chunkName]).layer = "release";
		apply(app.wpc.entry,
		{
			[`${chunkName}.debug`]:
			{
				import: `${relPath}/${chunkName}.${ext}`,
				layer: "debug"
			}
		});
	}
};


/**
 * Configures `webpackconfig.exports.entry`
 *
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 * @throws {WpBuildError}
 */
const entry = (app) =>
{
	app.wpc.entry = {};
	if (!isObjectEmpty(app.build.entry))
	{
		merge(app.wpc.entry, app.build.entry);
	}
	else if (builds[app.build.type || app.build.name])
	{
		builds[app.build.type || app.build.name](app);
	}
	else {
		 throw WpBuildError.getErrorProperty("entry", "exports/entry.js", app.wpc);
	}
	Object.values(app.wpc.entry).every((e) =>
	{
		if (!e || (!isString(e) && !e.import))
		{
			throw WpBuildError.getErrorProperty("entry", "exports/entry.js", app.wpc, "entry target is invalid");
		}
		if ((isString(e) && !e.startsWith(".")) || (!isString(e) && e.import.startsWith(".")))
		{
			app.logger.warning("entry target should contain a leading './' in path");
			return false;
		}
		return true;
	});
};


module.exports = entry;

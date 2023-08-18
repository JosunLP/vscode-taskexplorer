// @ts-check

/**
 * @file plugin/entry.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { glob } = require("glob");
const { extname, isAbsolute, relative } = require("path");
const typedefs = require("../types/typedefs");
const { apply, WpBuildError, merge, isObjectEmpty, isObject, isString } = require("../utils");


const globTestSuiteFiles= `**/*.{test,tests,spec,specs}.ts`;


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {typedefs.WpBuildApp} app Webpack build environment
	 */
	module: (app) =>
	{
		const srcPath = app.getSrcPath({ rel: true, ctx: true, dot: true, psx: true });
		app.wpc.entry = {
			[ app.build.name ]: {
				import: `${srcPath}/${app.build.name}.ts`,
				layer: "release"
			},
			[ `${app.build.name}.debug` ]: {
				import: `${srcPath}/${app.build.name}.ts`,
				layer: "debug"
			}
		};
	},


	/**
	 * @function
	 * @private
	 * @param {typedefs.WpBuildApp} app Webpack build environment
	 * @param {boolean} [fromMain]
	 */
	tests: (app, fromMain) =>
	{
		const testsPathAbs = app.getSrcTestsPath();
		app.wpc.entry = {
			...builds.testRunner(testsPathAbs, app, fromMain),
			...builds.testSuite(testsPathAbs)
		};
	},


	/**
	 * @function
	 * @private
	 * @param {string} testsPathAbs
	 * @param {typedefs.WpBuildApp} app Webpack build environment
	 * @param {boolean} [fromMain]
	 */
	testRunner: (testsPathAbs, app, fromMain) =>
	{
		return glob.sync(
			`**/*.ts`, {
				absolute: false, cwd: testsPathAbs, dotRelative: false, posix: true, ignore: [ globTestSuiteFiles ]
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(".ts", "")] = {
				import: `./${e}`,
				dependOn: fromMain ? [ app.build.name, `${app.build.name}.debug` ] : undefined
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
	 * @param {typedefs.WpBuildApp} app Webpack build environment
	 */
	types: (app) =>
	{
		let typesPath = app.getSrcTypesPath({ rel: true, ctx: true, dot: true, psx: true });
		if (!typesPath) {
			typesPath = app.getSrcPath({ rel: true, ctx: true, dot: true, psx: true });
		}
		app.wpc.entry = {
			[ app.build.name ]: {
				import: `${typesPath}/${app.build.name}.ts`,
				layer: "release"
			}
		};
	}

};


/**
 * @function
 * @private
 * @param {typedefs.WpBuildApp} app Webpack build environment
 * @param {string} file
 * @param {Partial<typedefs.EntryObject|typedefs.WpBuildWebpackEntry>} xOpts
 */
const addEntry= (app, file, xOpts) =>
{
	if (app.build.entry)
	{
		merge(app.wpc.entry, app.build.entry);
	}
	else
	{   const ext = extname(file),
			  chunkName = file.replace(new RegExp(`${ext}$`), ""),
			  relPath = !isAbsolute(file) ? file : relative(app.wpc.context, file);
		app.wpc.entry[chunkName] = {
			import: `${relPath}/${chunkName}.${ext}`
		};
	}
	return apply(app.wpc.entry, { ...xOpts });
};


/**
 * Configures `webpackconfig.exports.entry`
 *
 * @function
 * @param {typedefs.WpBuildApp} app Webpack build environment
 * @throws {WpBuildError}
 */
const entry = (app) =>
{
	if (isObject(app.build.entry) && !isObjectEmpty(app.build.entry))
	{
		app.wpc.entry = merge({}, app.build.entry);
	}
	else if (builds[app.build.type])
	{
		builds[app.build.type](app);
		// if (app.isTests && !app.buildEnvHasTests()) {
		// 	builds.tests(app, true);
		// }
	}
	else {
		 throw WpBuildError.getErrorProperty("entry", "exports/entry.js", app.wpc);
	}
	Object.values(app.wpc.entry).every((e) =>
	{
		if ((isString(e) && !e.startsWith(".")) || (!isString(e) && e.import.startsWith(".")))
		{
			app.logger.warning("entry target should contain a leading './' in path");
			return false;
		}
		return true;
	});
};


module.exports = entry;

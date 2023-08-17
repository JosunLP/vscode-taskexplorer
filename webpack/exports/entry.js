// @ts-check

/**
 * @file plugin/entry.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { glob } = require("glob");
const { apply, WpBuildError } = require("../utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackEntry} WebpackEntry */


const globTestSuiteFiles= `**/*.{test,tests,spec,specs}.ts`;


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
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
	 * @param {WpBuildApp} app Webpack build environment
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
	 * @param {WpBuildApp} app Webpack build environment
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
	 * @param {WpBuildApp} app Webpack build environment
	 */
	types: (app) =>
	{
		app.wpc.entry = {
			types: {
				import: `${app.getSrcPath({ rel: true, ctx: true, dot: true, psx: true })}/index.ts`
			}
		};
	}

};


/**
 * @function
 * @description Configures `webpackconfig.exports.entry`
 * @param {WpBuildApp} app Webpack build environment
 * @throws {WpBuildError}
 */
const entry = (app) =>
{
	if (app.build.entry)
	{
		app.wpc.entry = apply({}, app.build.entry);
	}
	else if (builds[app.build.type])
	{
		builds[app.build.type](app);
		if (app.isTests && !app.buildEnvHasTests()) {
			builds.tests(app, true);
		}
	}
	else {
		throw new WpBuildError("entry object or path is invalid", "exports/entry.js");
	}
};


module.exports = entry;

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


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 */
	module: (app) =>
	{
		const src = app.getSrcPath();
// console.log("!!!!!!!!: " + `${src}/${app.build.name}.ts ${app.wpc.context}`)
// throw new Error("1");
		app.wpc.entry = {
			[ app.build.name ]: {
				import: `${src}/${app.build.name}.ts`,
				layer: "release"
			},
			[ `${app.build.name}.debug` ]: {
				import: `${src}/${app.build.name}.ts`,
				layer: "debug"
			}
		};
		if (app.isTests) {
			// builds.tests(app, true);
		}
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 * @param {boolean} [fromMain]
	 */
	tests: (app, fromMain) =>
	{
		const src = app.getSrcPath() + (fromMain ? "/test" : "");
		app.wpc.entry = apply(app.wpc.entry || {},
		{
			"runTest": {
				import: `${src}/runTest.ts`,
				dependOn: fromMain ? [ app.build.name, `${app.build.name}.debug` ] : undefined
			},
			"control": {
				import: `${src}/control.ts`,
				dependOn: "runTest"
			},
			"suite/index": {
				import: `${src}/suite/index.ts`,
				dependOn: "runTest"
			},
			...builds.testSuite(src)
		});
	},


	/**
	 * @function
	 * @private
	 * @param {string} testsPath
	 */
	testSuite: (testsPath) =>
	{
		return glob.sync(
			`**/*.{test,spec}.ts`, {
				absolute: false, cwd: testsPath, dotRelative: false, posix: true
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
				import: `${app.getSrcPath()}/index.ts`
			}
		}
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
	}
	else {
		throw new WpBuildError("entry object or path is invalid", "exports/entry.js")
	}
};


module.exports = entry;

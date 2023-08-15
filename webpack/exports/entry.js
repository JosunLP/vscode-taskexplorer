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
		const src = app.getSrcPath({ rel: true, ctx: true, dot: true, psx: true });
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
		if (app.isTests && !app.rc.builds.find(b => b.type === "tests") && !app.rcInst.builds.find(b => b.type === "tests")) {
			builds.tests(app, true);
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
		const contextRel = app.getContextPath({ rel: true, ctx: true, dot: true, psx: true }) + (fromMain ? "/test" : "");
		app.wpc.entry = apply(app.wpc.entry || {},
		{
			"runTest": {
				import: `${contextRel}/runTest.ts`,
				dependOn: fromMain ? [ app.build.name, `${app.build.name}.debug` ] : undefined
			},
			"control": {
				import: `${contextRel}/control.ts`,
				dependOn: "runTest"
			},
			"suite/index": {
				import: `${contextRel}/suite/index.ts`,
				dependOn: "runTest"
			},
			...builds.testSuite(app.getContextPath({ rel: true, psx: true }) + (fromMain ? "/test" : ""))
		});
	},


	/**
	 * @function
	 * @private
	 * @param {string} contextAbs
	 */
	testSuite: (contextAbs) =>
	{
		return glob.sync(
			`**/*.{test,spec}.ts`, {
				absolute: false, cwd: contextAbs, dotRelative: false, posix: true
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

/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file plugin/entry.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { glob } = require("glob");
const { apply, isString, WpBuildError } = require("../utils");

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
		app.wpc.entry = apply({},
		{
			[ app.build.name ]: {
				import: `./${app.build.paths.src || app.paths.src}/${app.build.name}.ts`,
				layer: "release"
			},
			[ `${app.build.name}.debug` ]: {
				import: `./${app.build.paths.src || app.paths.src}/${app.build.name}.debug.ts`,
				layer: "debug"
			}
		});
		if (app.isTests) {
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
		const src = app.build.paths.src || app.paths.src;
		app.wpc.entry = apply(app.wpc.entry || {},
		{
			"runTest": {
				import: `./${src}/runTest.ts`,
				dependOn: fromMain ? [ app.build.name, `${app.build.name}.debug` ] : undefined
			},
			"control": {
				import: `./${src}/control.ts`,
				dependOn: "runTest"
			},
			"suite/index": {
				import: `./${src}/suite/index.ts`,
				dependOn: "runTest"
			},
			...builds.testSuite(app)
		});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 */
	testSuite: (app) =>
	{
		const src = app.build.paths.src || app.paths.src;
		return glob.sync(
			`./${src}/**/*.{test,spec}.ts`, {
				absolute: false, cwd: app.paths.src, dotRelative: false, posix: true
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace(`${src}/`, "").replace(".ts", "")] = {
				import: `./${e}`,
				dependOn: "runTest"
			};
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
				import: `./${app.build.paths.src || app.paths.src}/index.ts`
			}
		}
	},


	// /**
	//  * @function
	//  * @private
	//  * @param {WpBuildApp} app Webpack build environment
	//  */
	// webapp: (app) =>
	// {
	// 	app.wpc.entry = apply({}, app.rc.vscode.webview.apps);
	// }

};


/**
 * @function
 * @description Configures `webpackconfig.exports.entry`
 * @param {WpBuildApp} app Webpack build environment
 * @throws {WpBuildError}
 */
const entry = (app) =>
{
	if (app.build && app.build.entry)
	{
		app.wpc.entry = apply({}, app.build.entry);
	}
	else if (app.build && builds[app.build.type])
	{
		builds[app.build.type](app);
	}
	else {
		throw new WpBuildError("entry object or path is invalid", "exports/entry.js")
	}
};


module.exports = entry;

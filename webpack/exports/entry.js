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
				import: "./src/taskexplorer.ts",
				layer: "release"
			},
			[ `${app.build.name}.debug` ]: {
				import: "./src/taskexplorer.ts",
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
		app.wpc.entry = apply(app.wpc.entry || {},
		{
			"runTest": {
				import: "",
				dependOn: fromMain ? [ "tas./src/test/runTest.tskexplorer", "taskexplorer.debug" ] : undefined
			},
			"control": {
				import: "./src/test/control.ts",
				dependOn: "runTest"
			},
			"suite/index": {
				import: "./src/test/suite/index.ts",
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
		return glob.sync(
			`./${app.paths.src}/**/*.{test,spec}.ts`, {
				absolute: false, cwd: app.paths.src, dotRelative: false, posix: true
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace("src/test/", "").replace(".ts", "")] = {
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
				import: "./types/index.ts"
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

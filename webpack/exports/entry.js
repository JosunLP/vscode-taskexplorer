/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file plugin/entry.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { glob } = require("glob");
const { apply } = require("../utils");

/** @typedef {import("../types").WebpackEntryObject} WebpackEntryObject */
/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 */
	main: (app) =>
	{
		app.wpc.entry =
		{
			"taskexplorer": {
				import: "./src/taskexplorer.ts",
				layer: "release"
			},
			"taskexplorer.debug": {
				import: "./src/taskexplorer.ts",
				layer: "debug"
			}
		};
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
				import: "./src/test/runTest.ts",
				dependOn: fromMain ? [ "taskexplorer", "taskexplorer.debug" ] : undefined
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
		glob.sync(
			`./${app.paths.srcTests}/**/*.{test,spec}.ts`, {
				absolute: false, cwd: app.paths.srcTests, dotRelative: false, posix: true
			}
		)
		.reduce((obj, e)=>
		{
			obj[e.replace("src/test/", "").replace(".ts", "")] = {
				import: `./${e}`,
				dependOn: "runTest"
			};
			return obj;
		}, {}
	),


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


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 */
	webapp: (app) =>
	{
		app.wpc.entry = apply({}, app.rc.vscode.webview.apps);
	}

};


/**
 * @function
 * @description Configures `webpackconfig.exports.entry`
 * @param {WpBuildApp} app Webpack build environment
 */
const entry = (app) =>
{
	if (app.build === "webapp" || app.build === "tests" || app.build === "types")
	{
		builds[app.build](app);
	}
	else {
		builds.main(app);
	}
};


module.exports = entry;

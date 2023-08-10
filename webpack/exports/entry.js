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

/**
 * @module wpbuild.exports.entry
 */

/** @typedef {import("../types").WebpackEntryObject} WebpackEntryObject */
/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function
 * @description Configures `webpackconfig.exports.entry`
 * @param {WpBuildApp} app Webpack build environment
 */
const entry = (app) =>
{
	if (app.build === "webview" && app.rc.vscode)
	{
		webviewEntry(app);
	}
	else if (app.build === "tests")
	{
		testSuiteEntry(app);
	}
	else if (app.build === "types")
	{
		typesEntry(app);
	}
	else
	{
		mainEntry(app);
		if (app.environment === "test") {
			testSuiteEntry(app);
		}
	}
};


/**
 * @function
 * @description Configures `webpackconfig.exports.entry` for the **main** application` build
 * @param {WpBuildApp} app Webpack build environment
 */
const mainEntry = (app) =>
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
};


/**
 * @function
 * @private
 * @description Configures `webpackconfig.exports.entry` for the **test suite** build
 * @param {WpBuildApp} app Webpack build environment
 */
const testSuiteEntry = (app) =>
{
	const entry = app.wpc.entry || {};
	const testFiles = glob.sync("./src/test/suite/**/*.{test,spec}.ts", { dotRelative: false, posix: true }).reduce(
		(obj, e)=>
		{
			obj[e.replace("src/test/", "").replace(".ts", "")] = {
				import: `./${e}`,
				dependOn: "runTest"
			};
			return obj;
		}, {}
	);
	app.wpc.entry = apply(entry, {
		"runTest": {
			import: "./src/test/runTest.ts",
			dependOn: [ "taskexplorer", "taskexplorer.debug" ]
		},
		"control": {
			import: "./src/test/control.ts",
			dependOn: "runTest"
		},
		"suite/index": {
			import: "./src/test/suite/index.ts",
			dependOn: "runTest"
		},
		...testFiles
	});
};


/**
 * @function
 * @private
 * @description Configures `webpackconfig.exports.entry` for the **types** build
 * @param {WpBuildApp} app Webpack build environment
 */
const typesEntry = (app) => { app.wpc.entry = { types: { import: "./types/index.ts" }}; };


/**
 * @function
 * @private
 * @description Configures `webpackconfig.exports.entry` for the **vscode webview** build
 * @param {WpBuildApp} app Webpack build environment
 */
const webviewEntry = (app) => { app.wpc.entry = apply({}, app.rc.vscode.webview.apps); };


module.exports = entry;

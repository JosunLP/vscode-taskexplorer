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
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function
 * @description Configures `webpackconfig.exports.entry`
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const entry = (env) =>
{
	if (env.build === "webview" && env.app.vscode)
	{
		webviewEntry(env);
	}
	else if (env.build === "tests")
	{
		testSuiteEntry(env);
	}
	else if (env.build === "types")
	{
		typesEntry(env);
	}
	else
	{
		mainEntry(env);
		// if (env.environment === "test") {
		// 	   testSuiteEntry(env, env.wpc.entry);
		// }
	}
};


/**
 * @function
 * @description Configures `webpackconfig.exports.entry` for the **main** application` build
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const mainEntry = (env) =>
{
	env.wpc.entry =
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
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const testSuiteEntry = (env) =>
{
	const entry = /** @type {WebpackEntryObject} */(env.wpc.entry || {});
	const testFiles = glob.sync("./src/test/suite/**/*.{test,spec}.ts", { dotRelative: false, posix: true }).reduce(
		(obj, e)=>
		{
			obj[e.replace("src/test/", "").replace(".ts", "")] = {
				import: `./${e}`
			};
			return obj;
		}, {}
	);
	env.wpc.entry = apply(entry, {
		"runTest": /** @type {WebpackEntryObject} */({
			import: "./src/test/runTest.ts",
			dependOn: env.build !== "tests" ? "taskexplorer" : undefined
		}),
		"control": /** @type {WebpackEntryObject} */({
			import: "./src/test/control.ts"
		}),
		"suite/index": {
			import: "./src/test/suite/index.ts"
		},
		...testFiles
	});
};


/**
 * @function
 * @private
 * @description Configures `webpackconfig.exports.entry` for the **types** build
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const typesEntry = (env) => { env.wpc.entry = { types: { import: "./types/index.ts" }}; };


/**
 * @function
 * @private
 * @description Configures `webpackconfig.exports.entry` for the **vscode webview** build
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const webviewEntry = (env) => { env.wpc.entry = apply({}, env.app.vscode.webview.apps); };


module.exports = entry;

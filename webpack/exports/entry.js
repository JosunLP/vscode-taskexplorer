/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { glob } = require("glob");
const { parse } = require("path");
const { apply } = require("../utils");

/**
 * @module wpbuild.exports.entry
 */

/** @typedef {import("../types").WebpackEntryObject} WebpackEntryObject */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function entry
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const entry = (env) =>
{
	if (env.build === "webview" && env.app.vscode)
	{
		env.wpc.entry = env.app.vscode.webview.apps;
	}
	else if (env.build === "tests")
	{
		env.wpc.entry = {};
		applyTestsEnties(env, env.wpc.entry);
	}
	else if (env.build === "types")
	{
		// env.wpc.entry =
		// {
		// 	types: {
		// 	 	import: "./types/index.ts"
		// 	}
		// };
	}
	else
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
		if (env.environment === "test") {
			//applyTestsEnties(env, env.wpc.entry);
		}
	}
};


/**
 * @function entry
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackEntryObject} entry Webpack build environment
 */
const applyTestsEnties = (env, entry) =>
{
	const testFiles = glob.sync("./src/test/suite/**/*.{test,spec}.ts", { dotRelative: false, posix: true }).reduce(
		(obj, e)=>
		{
			obj[e.replace("src/test/", "").replace(".ts", "")] = {
				import: `./${e}`
			};
			return obj;
		}, {}
	);
	apply(entry, {
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


module.exports = entry;

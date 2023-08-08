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
		applyTestsEnties(env.wpc.entry);
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
			applyTestsEnties(env, env.wpc.entry);
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
	const testFiles = glob.sync("./src/test/suite/**/*.{test,spec}.ts", { dotRelative: true, posix: true }).reduce(
		(obj, e)=>
		{
			obj[parse(e).name] = {
				import: e,
				dependOn: "runTest"
			};
			return obj;
		}, {}
	);
	apply(entry, {
		"runTest": /** @type {WebpackEntryObject} */({
			import: "./src/test/runTest.ts",
			dependOn: env.build !== "tests" ? "taskexplorer" : undefined
		}),
		"suite/index": {
			import: "./src/test/suite/index.ts",
			dependOn: "runTest"
		},
		...testFiles
	});
};


module.exports = entry;

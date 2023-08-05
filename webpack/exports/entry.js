/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module wpbuild.exports.entry
 */

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
		// const testFiles = glob.sync("./src/test/suite/**/*.{test,spec}.ts").reduce(
		// 	(obj, e)=>
		// 	{
		// 		obj["suite/" + path.parse(e).name] = e;
		// 		return obj;
		// 	}, {}
		// );
		env.wpc.entry =
		{
			runTest: "./src/test/runTest.ts"
			// "run/index": "./src/test/run/index.ts",
			// ...testFiles
		};
	}
	else if (env.build === "types")
	{
		env.wpc.entry =
		{
			types: {
			 	import: "./types/index.ts"
			}
		};
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
	}
};


module.exports = entry;

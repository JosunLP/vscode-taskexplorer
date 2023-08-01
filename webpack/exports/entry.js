/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module wpbuild.exports.entry
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function entry
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const entry = (env, wpConfig) =>
{
	if (env.build === "webview" && env.app.vscode)
	{
		wpConfig.entry = env.app.vscode.webview.apps;
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
		wpConfig.entry =
		{
			runTest: "./src/test/runTest.ts"
			// "run/index": "./src/test/run/index.ts",
			// ...testFiles
		};
	}
	else
	{
		wpConfig.entry =
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

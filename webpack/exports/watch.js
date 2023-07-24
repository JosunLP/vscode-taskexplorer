// @ts-check

/**
 * @module webpack.exports.watch
 */

/** @typedef {import("../types").WebpackArgs} WebpackArgs */
/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */


/**
 * @method target
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 * @param {WebpackArgs} argv Webpack command line args
 */
const watch = (env, wpConfig, argv) =>
{
	wpConfig.watch = !!argv.watch;
	if (wpConfig.watch)
	{
		wpConfig.watchOptions =
		{
			poll: true,
			stdin: true,
			followSymlinks: false,
			ignored: [
				"**/node_modules", "**/dist", "**/doc", "**/res", "**/script", "**/test",
				"**/types", "**/webpack/**/*.js", "**/.vscode", "**/.vscode-test",
				"**/.nyc_output", "**/.coverage", "**/.github"
			]
		};
	}
};


module.exports = watch;

// @ts-check

/**
 * @module wpbuild.exports.watch
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function target
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const watch = (env) =>
{
	env.wpc.watch = !!env.argv.watch || !!env.WEBPACK_WATCH;
	if (env.wpc.watch)
	{
		env.wpc.watchOptions =
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

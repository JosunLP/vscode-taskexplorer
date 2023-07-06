// @ts-check

/**
 * @module webpack.exports.watch
 */

/** @typedef {import("../types/webpack").WebpackArgs} WebpackArgs */
/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


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
			ignored: /(node_modules|test|webpack|doc|.vscode(?:\-test)?|res|types)[\\\/]/
		};
	}
};


module.exports = watch;

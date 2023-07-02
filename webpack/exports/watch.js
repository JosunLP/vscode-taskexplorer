// @ts-check

/**
 * @module webpack.exports.watch
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


/**
 * @method target
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const watch = (env, wpConfig) =>
{
	wpConfig.watchOptions =
	{
		poll: true,
		followSymlinks: false,
		ignored: /(node_modules|test|webpack|doc|.vscode(?:\-test)?|res|types)[\\\/]/
	};
};


module.exports = watch;

// @ts-check

/**
 * @module wpbuild.exports.optimization
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function optimization
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const optimization = (env, wpConfig) =>
{
	parallelism(env, wpConfig);

	if (env.isExtension)
	{
		wpConfig.optimization =
		{
			runtimeChunk: "single",
			splitChunks: false
		};
		if (env.build !== "browser")
		{
			wpConfig.optimization.splitChunks =
			{
				cacheGroups: {
					vendor: {
						test: /node_modules/,
						name: "vendor",
						chunks: "all"
					}
				}
			};
			if (env.environment === "prod")
			{
				wpConfig.optimization.chunkIds = "deterministic";
			}
		}
	}
	else {
		wpConfig.optimization = {};
	}
};


/**
 * @function optimization
 * @private
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const parallelism = (env, wpConfig) =>
{
	if (env.build === "webview" && env.app.vscode)
	{
		wpConfig.parallelism = 1 + Object.keys(env.app.vscode.webview.apps).length;
	}
	else {
		wpConfig.parallelism = 3; // extension / vendor / runtime
	}
};


module.exports = optimization;

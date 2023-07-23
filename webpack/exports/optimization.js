// @ts-check

/**
 * @module webpack.exports.optimization
 */

const webviewApps = require("../webviewApps");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


/**
 * @method optimization
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const optimization = (env, wpConfig) =>
{
	parallelism(env, wpConfig);

	if (env.build === "extension" || env.build === "browser")
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
 * @method optimization
 * @private
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const parallelism = (env, wpConfig) =>
{
	if (env.build === "webview")
	{
		wpConfig.parallelism = Object.keys(webviewApps).length;
	}
	else {
		wpConfig.parallelism = 4; // extension x 2 / vendor / runtime
	}
};


module.exports = optimization;

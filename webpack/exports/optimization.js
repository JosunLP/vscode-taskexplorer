// @ts-check

const { apply } = require("../utils");

/**
 * @file exports/optimization.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackOptimization} WebpackOptimization */
/** @typedef {import("../types").WpBuildWebpackConfig} WpBuildWebpackConfig */

/**
 * @function optimization
 * @param {WpBuildApp} app Webpack build environment
 */
const optimization = (app) =>
{
	if (app.rc.exports.optimization)
	{
		parallelism(app)
		if (app.isMain)
		{
			app.wpc.optimization =
			{
				runtimeChunk: "single",
				splitChunks: false
			};
			if (app.build !== "web")
			{
				app.wpc.optimization.splitChunks =
				{
					cacheGroups: {
						vendor: {
							test: /node_modules/,
							name: "vendor",
							chunks: "all"
						}
					}
				};
				if (app.mode === "production")
				{
					app.wpc.optimization.chunkIds = "deterministic";
				}
			}
		}
	}
};


/**
 * @function optimization
 * @param {WpBuildApp} app Webpack build environment
 */
const parallelism = (app) =>
{
	apply(app.wpc, { parallelism: 1 + Object.keys(app.rc.environment.builds[app.build]).length });
};


module.exports = optimization;

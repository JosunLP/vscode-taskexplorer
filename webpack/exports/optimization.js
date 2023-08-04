// @ts-check

/**
 * @module wpbuild.exports.optimization
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function optimization
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const optimization = (env) =>
{
	parallelism(env);

	if (env.isExtension)
	{
		env.wpc.optimization =
		{
			runtimeChunk: "single",
			splitChunks: false
		};
		if (env.build !== "web")
		{
			env.wpc.optimization.splitChunks =
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
				env.wpc.optimization.chunkIds = "deterministic";
			}
		}
	}
	else {
		env.wpc.optimization = {};
	}
};


/**
 * @function optimization
 * @private
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const parallelism = (env) =>
{
	if (env.build === "webview" && env.app.vscode)
	{
		env.wpc.parallelism = 1 + Object.keys(env.app.vscode.webview.apps).length;
	}
	else {
		env.wpc.parallelism = 3; // extension / vendor / runtime
	}
};


module.exports = optimization;

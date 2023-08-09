// @ts-check

/**
 * @module wpbuild.exports.optimization
 */

/** @typedef {import("../types").WpBuildApp} WpBuildApp */


/**
 * @function optimization
 * @param {WpBuildApp} app Webpack build environment
 */
const optimization = (app) =>
{
	parallelism(app);

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
			if (app.environment === "prod")
			{
				app.wpc.optimization.chunkIds = "deterministic";
			}
		}
	}
	else {
		app.wpc.optimization = {};
	}
};


/**
 * @function optimization
 * @private
 * @param {WpBuildApp} app Webpack build environment
 */
const parallelism = (app) =>
{
	if (app.build === "webview" && app.rc.vscode)
	{
		app.wpc.parallelism = 1 + Object.keys(app.rc.vscode.webview.apps).length;
	}
	else {
		app.wpc.parallelism = 3; // extension / vendor / runtime
	}
};


module.exports = optimization;

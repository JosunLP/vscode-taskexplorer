// @ts-check

/**
 * @file exports/extenals.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * NOTE: The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be
 * webpack'ed, -> https://webpack.js.org/configuration/externals/
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("webpack").ExternalItemFunctionData} ExternalItemFunctionData */
/** @typedef {import("webpack").ExternalItemObjectKnown & import("webpack").ExternalItemObjectUnknown} NodeExternalsExternalItem */

// eslint-disable-next-line import/no-extraneous-dependencies
const nodeExternals = require("webpack-node-externals");


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const externals = (app) =>
{
	if (app.rc.exports.externals)
	{
		if (app.rc.exports.externals || app.rc.vscode)
		{
			if (app.isWeb) {
				app.wpc.externalsPresets = { web: true };
			}
			else {
				app.wpc.externalsPresets = { node: true };
			}
		}
		if (app.rc.vscode)
		{
			if (app.build !== "tests")
			{
				app.wpc.externals = [
					(data, callback) => callback(logAsset(data, app), { vscode: "commonjs vscode" }),
					(data, callback) => callback(logAsset(data, app), !data.contextInfo?.issuerLayer ? nodeExternals() : undefined)
				];
			}
			else {
				app.wpc.externals = [
					{ vscode: "commonjs vscode" },
					// { nyc: "commonjs nyc" },
					/** @type {NodeExternalsExternalItem}*/(nodeExternals())
				];
			}
		}
		else if (app.rc.exports.externals && app.build !== "tests" && app.build !== "types")
		{
			app.wpc.externals = /** @type {NodeExternalsExternalItem} */(nodeExternals());
		}
	}
};


/**
 * @param {Readonly<ExternalItemFunctionData>} data
 * @param {WpBuildApp} app Webpack build environment
 */
const logAsset = (data, app) =>
{
	if (data && data.request)
	{
		app.logger.write(`set externals for asset italic(${data.request.substring(2)})`, 5);
		app.logger.value("   context", data.context, 5);
		app.logger.value("   dependencyType", data.dependencyType, 5);
		app.logger.value("   request", data.request, 5);
		if (data.contextInfo)
		{
			app.logger.value("   issuer", data.contextInfo.issuer, 5);
			app.logger.value("   issuer layer", data.contextInfo.issuerLayer, 5);
			// `compiler` value isin form `vscode-taskexplorer|undefined|extension|test|node|none`
			app.logger.value("   compiler / wpconfig exports.name", data.contextInfo.compiler, 5);
		}
	}
	return undefined;
};


module.exports = externals;

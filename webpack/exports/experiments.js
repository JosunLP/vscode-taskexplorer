/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file exports/experimental.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function entry
 * @param {WpBuildApp} app Webpack build environment
 */
const experiments = (app) =>
{
	if (app.rc.exports.experiments)
	{
		app.wpc.experiments = { layers: app.isMain };
	}
};


module.exports = experiments;

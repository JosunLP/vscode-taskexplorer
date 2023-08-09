/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file exports/experimental.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function entry
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const experiments = (env) =>
{
	env.wpc.experiments = { layers: env.isMain };
};


module.exports = experiments;

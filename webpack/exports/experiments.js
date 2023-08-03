/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @module wpbuild.exports.experiments
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function entry
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const experiments = (env) =>
{
	env.wpc.experiments = { layers: env.isExtension };
};


module.exports = experiments;

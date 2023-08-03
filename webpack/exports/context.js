// @ts-check

/**
 * @module wpbuild.exports.context
 */

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @method
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const context = (env) =>
{
	env.wpc.context = env.paths.base;
};


module.exports = context;

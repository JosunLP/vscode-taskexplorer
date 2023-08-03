// @ts-check

/**
 * @module wpbuild.exports.name
 */

/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const name = (env) =>
{
	env.wpc.name = `${env.app.name}|${env.app.version}|${env.build}|${env.environment}|${env.target}|${env.wpc.mode}`;
};


module.exports = name;

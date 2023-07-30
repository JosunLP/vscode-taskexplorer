// @ts-check

/**
 * @module webpack.exports.name
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const name = (env, wpConfig) =>
{
	wpConfig.name = `${env.app.name}|${env.app.version}|${env.build}|${env.environment}|${env.target}|${wpConfig.mode}`;
};


module.exports = name;

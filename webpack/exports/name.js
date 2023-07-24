// @ts-check

/**
 * @module webpack.exports.name
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackBuild} WebpackBuild */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */


/**
 * @method
 * @param {WebpackBuild} buildTarget Build target
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const name = (buildTarget, env, wpConfig) =>
{
	wpConfig.name = `${env.app.name}:${env.app.version}:${env.environment}:${buildTarget}:${wpConfig.mode}`;
};


module.exports = name;

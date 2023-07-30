// @ts-check

/**
 * @module webpack.exports.name
 */

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @function
 * @param {WpBuildModule} buildName Build name e.g. `extension`, `webview` etc
 * @param {WpBuildEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const name = (buildName, env, wpConfig) =>
{
	wpConfig.name = `${env.app.name}|${env.app.version}|${env.environment}|` +
					`${buildName}|${env.target}|${wpConfig.mode}`;
};


module.exports = name;

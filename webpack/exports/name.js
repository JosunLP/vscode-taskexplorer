// @ts-check

/**
 * @module wpbuild.exports.name
 */

/** @typedef {import("../types").WpBuildModule} WpBuildModule */
/** @typedef {import("../types").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const name = (app) =>
{
	app.wpc.name = `${app.rc.name}|${app.rc.version}|${app.build}|${app.environment}|${app.target}|${app.wpc.mode}`;
};


module.exports = name;

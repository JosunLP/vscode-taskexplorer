// @ts-check

/**
 * @module wpbuild.exports.context
 */

/** @typedef {import("../types").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const context = (app) =>
{
	app.wpc.context = app.paths.base;
};


module.exports = context;

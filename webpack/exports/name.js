// @ts-check

/**
 * @file exports/name.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const name = (app) =>
{
	app.wpc.name = `${app.rc.name}|${app.rc.pkgJson.version}|${app.build}|${app.mode}|${app.target}|${app.wpc.mode}`;
};


module.exports = name;

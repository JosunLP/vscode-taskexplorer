/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file exports/context.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { WpBuildApp } = require("../utils");


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const context = (app) =>
{
	app.wpc.context = app.paths.base;
};


module.exports = context;

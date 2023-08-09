/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/ignore.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const webpack = require("webpack");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */


/**
 * @param {WpBuildApp} app
 * @returns {webpack.IgnorePlugin | undefined}
 */
const ignore = (app) =>
{
    /** @type {webpack.IgnorePlugin | undefined} */
    let plugin;
    if (app.rc.plugins.ignore !== false && app.wpc.mode === "production")
    {
        plugin = new webpack.IgnorePlugin(
        {
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
        });
    }
    return plugin;
};


module.exports = ignore;

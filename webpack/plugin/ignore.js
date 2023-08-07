/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/ignore.js
 * @author Scott Meesseman
 */

const webpack = require("webpack");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @returns {webpack.IgnorePlugin | undefined}
 */
const ignore = (env) =>
{
    /** @type {webpack.IgnorePlugin | undefined} */
    let plugin;
    if (env.app.plugins.ignore !== false && env.wpc.mode === "production")
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

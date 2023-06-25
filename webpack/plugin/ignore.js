/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const webpack = require("webpack");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */

/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {webpack.IgnorePlugin | undefined}
 */
const banner = (env, wpConfig) =>
{
    let plugin;
    if (wpConfig.mode === "production")
    {
        plugin = new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
          });
    }
    return plugin;
};

module.exports = banner;

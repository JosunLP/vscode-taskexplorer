/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.sourcemaps
 */

const webpack = require("webpack");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */


/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {webpack.SourceMapDevToolPlugin | undefined}
 */
const sourcemaps = (env, wpConfig) =>
{
    let plugin;
    if (env.build !== "webview" && wpConfig.mode !== "production")
    {
        const isDev = env.environment === "dev" || wpConfig.mode === "development",
              isTests = env.environment.startsWith("test");
        const options =
        {
            test: /\.(js|jsx)($|\?)/i,
            exclude: /((vendor|runtime|tests)\.js|node_modules)/,
            filename: "[name].js.map",
            //
            // The bundled node_modules will produce reference tags within the main entry point
            // files in the form:
            //
            //     external commonjs "vscode"
            //     external-node commonjs "crypto"
            //     ...etc...
            //
            // This breaks the istanbul reporting library when the tests have completed and the
            // coverage report is being built (via nyc.report()).  Replace the quote and space
            // characters in this external reference name with filename firiendly characters.
            //
            /** @type {any} */moduleFilenameTemplate: (/** @type {any} */info) =>
            {
                if ((/[\" \|]/).test(info.absoluteResourcePath)) {
                    return info.absoluteResourcePath.replace(/\"/g, "").replace(/[ \|]/g, "_");
                }
                return `${info.absoluteResourcePath}`;
            },
            // moduleFilenameTemplate: ".[resource-path]",
            // moduleFilenameTemplate: '[absolute-resource-path]',
            fallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
        };
        if (isDev)
        {
            options.filename = "[name].js.map";
            options.moduleFilenameTemplate = "[absolute-resource-path]";
            // options.moduleFilenameTemplate = "../[resource-path]";
            // options.fallbackModuleFilenameTemplate = '[resource-path]?[hash]';
            options.exclude = /((runtime|tests)\.js|node_modules)/;
        }
        else if (isTests)
        {
            options.exclude = /((vendor|runtime)\.js|node_modules)/;
        }
        plugin = new webpack.SourceMapDevToolPlugin(options);
    }
    return plugin;
};

module.exports = sourcemaps;

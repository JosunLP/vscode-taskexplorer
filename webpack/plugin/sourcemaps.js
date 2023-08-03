/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.sourcemaps
 *
 * IMPORTANT NOTE:
 *
 * This module contains project specifc code and the sync script should be modified
 * if necessary when changes are made to this file.
 */

const webpack = require("webpack");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */


/**
 * @param {WpBuildEnvironment} env
 * @returns {webpack.SourceMapDevToolPlugin | undefined}
 */
const sourcemaps = (env) =>
{
    let plugin;
    if (env.app.plugins.sourcemaps !== false && env.build !== "webview")
    {
        const isTests = env.environment.startsWith("test");
        const options =
        {
            test: /\.(js|jsx)($|\?)/i,
            exclude: /(?:node_modules|(?:vendor|runtime|tests)(?:\.[a-f0-9]{16,})?\.js)/,
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
            fallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
        };
        if (isTests) {
            options.exclude = /(?:node_modules|(?:vendor|runtime)(?:\.[a-f0-9]{16,})?\.js)/;
        }
        plugin = new webpack.SourceMapDevToolPlugin(options);
    }
    return plugin;
};


module.exports = sourcemaps;

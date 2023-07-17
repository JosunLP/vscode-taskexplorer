/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.afterdone
 */

const { join } = require("path");
const { renameSync, existsSync, writeFileSync, readFileSync, copyFileSync } = require("fs");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */


 /**
  * @param {WebpackEnvironment} env
  * @param {WebpackConfig} wpConfig Webpack config object
  * @returns {WebpackPluginInstance | undefined}
  */
const afterdone = (env, wpConfig) =>
{
    // "AfterDonePlugin" MUST BE LAST IN THE PLUGINS ARRAY!!
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build !== "webview")
    {
        const _env = { ...env },
              _wpConfig = { ...wpConfig };
        plugin =
        {   /** @param {import("webpack").Compiler} compiler Compiler */
            apply: (compiler) =>
            {
                compiler.hooks.afterDone.tap("AfterDonePlugin", () =>
                {
                    const distPath = join(env.buildPath, "dist");
                    if (_wpConfig.mode === "production")
                    {
                        try {
                            renameSync(join(distPath, "vendor.js.LICENSE.txt"), join(distPath, "vendor.LICENSE"));
                            renameSync(join(distPath, "taskexplorer.js.LICENSE.txt"), join(distPath, "taskexplorer.LICENSE"));
                        } catch {}
                    }
                    else if (_env.build === "extension" && _env.environment === "test")
                    {
                        const outFile = join(distPath, "taskexplorer.js");
                        if (existsSync(outFile))
                        {
                            const regex = /\n[ \t]*module\.exports \= require\(/mg,
                                    content = readFileSync(outFile, "utf8").replace(regex, (v) => "/* istanbul ignore next */" + v);
                            writeFileSync(outFile, content);
                        }
                    }
                    if (_env.build === "extension") {
                        copyFileSync(join(env.buildPath, "node_modules", "source-map", "lib", "mappings.wasm"), join(distPath, "mappings.wasm"));
                    }
                });
            }
        };
    }
    return plugin;
};


module.exports = afterdone;

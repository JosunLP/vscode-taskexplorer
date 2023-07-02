/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.afterdone
 */

const path = require("path");
const { renameSync, existsSync, writeFileSync, readFileSync } = require("fs");

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
                compiler.hooks.done.tap("AfterDonePlugin", () =>
                {
                    if (_wpConfig.mode === "production")
                    {
                        try {
                            renameSync(path.join(env.buildPath, "dist", "vendor.js.LICENSE.txt"), path.join(env.buildPath, "dist", "vendor.LICENSE"));
                            renameSync(path.join(env.buildPath, "dist", "taskexplorer.js.LICENSE.txt"), path.join(env.buildPath, "dist", "taskexplorer.LICENSE"));
                        } catch {}
                    }
                    else if (_env.build === "extension" && _env.environment === "test")
                    {
                        const outFile = path.join(env.buildPath, "dist", "taskexplorer.js");
                        if (existsSync(outFile))
                        {
                            const regex = /\n[ \t]*module\.exports \= require\(/mg,
                                    content = readFileSync(outFile, "utf8").replace(regex, (v) => "/* istanbul ignore next */" + v);
                            writeFileSync(outFile, content);
                        }
                    }
                });
            }
        };
    }
    return plugin;
};


module.exports = afterdone;

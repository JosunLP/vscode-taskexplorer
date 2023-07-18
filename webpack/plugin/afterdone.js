/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.afterdone
 */

const { join, resolve } = require("path");
const { writeInfo, figures } = require("../console");
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
                    if (_env.build === "extension")
                    {
                        const distPath = join(env.buildPath, "dist");
                        if (_env.environment === "prod" || _wpConfig.mode === "production")
                        {
                            try {
                                renameSync(join(distPath, "vendor.js.LICENSE.txt"), join(distPath, "vendor.LICENSE"));
                            } catch {}
                            try {
                                renameSync(join(distPath, "taskexplorer.js.LICENSE.txt"), join(distPath, "taskexplorer.LICENSE"));
                            } catch {}
                            try {
                                renameSync(
                                    join(distPath, "taskexplorer.js.map"),
                                    resolve(env.buildPath, "..", "spm-license-server", "res", "app", "vscode-taskexplorer", "taskexplorer.js.map")
                                );
                            } catch {}
                        }
                        else if (_env.environment === "test")
                        {
                            const outFile = join(distPath, "taskexplorer.js");
                            if (existsSync(outFile))
                            {
                                const regex = /\n[ \t]*module\.exports \= require\(/mg,
                                      content = readFileSync(outFile, "utf8"),
                                      newContent = content.replace(regex, (v) => "/* istanbul ignore next */" + v);
                                try {
                                    writeFileSync(outFile, newContent);
                                } catch {}
                                if (content.includes("/* istanbul ignore file */")) {
                                    writeInfo("The '/* istanbul ignore file */ ' tag was found and will break coverage", figures.error);
                                }
                            }
                            try {
                                copyFileSync(
                                    join(distPath, "taskexplorer.js.map"),
                                    resolve(env.buildPath, "..", "spm-license-server", "res", "app", "vscode-taskexplorer", "taskexplorer.js.map")
                                );
                            } catch {}
                        }
                        else {
                            try {
                                copyFileSync(
                                    join(distPath, "taskexplorer.js.map"),
                                    resolve(env.buildPath, "..", "spm-license-server", "res", "app", "vscode-taskexplorer", "taskexplorer.js.map")
                                );
                            } catch {}
                        }
                        try {
                            copyFileSync(
                                join(env.buildPath, "node_modules", "source-map", "lib", "mappings.wasm"),
                                resolve(env.buildPath, "..", "spm-license-server", "res", "app", "log", "mappings.wasm")
                            );
                        } catch {}
                    }
                });
            }
        };
    }
    return plugin;
};


module.exports = afterdone;

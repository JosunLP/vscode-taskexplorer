/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.compile
 */

const { readdirSync, copyFileSync } = require("fs");
const { join, resolve } = require("path");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method beforeemit
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const compile = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        plugin =
        {
            apply: (compiler) =>
            {

                compiler.hooks.emit.tap("CompileEmitPlugin", (compilation) =>
                {
                    Object.keys(compilation.assets).forEach((basename) =>
                    {
                        if (/taskexplorer\./.test(basename))
                        {
                            const asset = compilation.assets[basename],
                                  content= asset.source().toString(),
                                  regex = /\n[ \t]*module\.exports \= require\(/mg,
                                  newContent = content.replace(regex, (v) => "/* istanbul ignore next */" + v);
                            asset.source = () => { return newContent; };
                            asset.size = () => asset.source().length;
                        }
                    });
                });

                // compiler.hooks.thisCompilation.tap("CompileThisCompilationPlugin", (compilation) =>
                // {
                //     if (env.environment !== "prod" && !env.stripLogging)
                //     {
                //     }
                //     const logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                //     const cache = compilation.getCache("CompileThisCompilationPlugin");

                //     compilation.hooks.processAssets.tapAsync(
                //     {
                //         name: "CompileProcessAssetsCompilationPlugin",
                //         // stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                //         stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
                //     },
                //     async (unusedAssets, callback) =>
                //     {
                //         // const existingAsset = compilation.getAsset(filename);
                //         // compilation.emitAsset(filename, source, { ...info,
                //         //   ..result.info
                //         // });
                //         callback();
                //     });

                //     if (compilation.hooks.statsPrinter)
                //     {
                //         compilation.hooks.statsPrinter.tap("CompileThisCompilationPlugin", (stats) =>
                //         {
                //             stats.hooks.print.for("asset.info.copied").tap(
                //                 "CompileProcessAssetsCompilationPlugin",
                //                 (copied, { green, formatFlag }) => {
                //                     return copied ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)("copied")) : ""
                //                 }
                //             );
                //         });
                //     }
                // });
            }
        };
    }
    return plugin;
};


/**
 * @method _upload
 * @param {WebpackStatsAsset[]} assets
 * @param {WebpackEnvironment} env
 */
const dupHashFile= (assets, env) =>
{
    const teModule = assets.find(a => a.startsWith("taskexplorer") && a.endsWith(".js"));
    if (teModule) {
        copyFileSync(join(env.paths.dist, teModule.name), join(env.paths.dist, "taskexplorer.js"));
    }
};


module.exports = compile;

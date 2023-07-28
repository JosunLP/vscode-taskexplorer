/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.compile
 */

const { join } = require("path");
const { copyFileSync } = require("fs");
const { getEntriesRegex } = require("../utils/utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function compile
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const compile = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension" && env.environment === "test" && env.buildMode !== "debug")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.compilation.tap("CompileThisCompilationPlugin_STAGE_ADDITIONS", (compilation) =>
                {
                    // const cache = compilation.getCache("CompileThisCompilationPlugin"),
                    //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");

                    compilation.hooks.processAssets.tap(
                    {
                        name: "CompileProcessAssets_STAGE_ADDITIONS",
                        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
                    },
                    (assets) =>
                    {
                        const entriesRgx = getEntriesRegex(wpConfig);
                        Object.entries(assets).filter(a => new RegExp(entriesRgx).test(a[0])).forEach(a =>
                        {
                            const fileName = a[0],
                                  { source, map } = a[1].sourceAndMap(),
                                  content= source.toString(),
                                  regex = /\n[ \t]*module\.exports \= require\(/gm,
                                  newContent = content.replace(regex, (v) => "/* istanbul ignore next */" + v),
                                  info = compilation.getAsset(fileName)?.info;
                            // compilation.updateAsset(
                            //     fileName,
                            //     compiler.options.devtool ? new sources.SourceMapSource(newContent, fileName, map) :
                            //                               new sources.RawSource(newContent)
                            // );
                            compilation.updateAsset(
                                fileName,
                                new compiler.webpack.sources.SourceMapSource(newContent, fileName, map),
                                { ...info, istanbulTagged: true })
                            ;
                        });

                        if (compilation.hooks.statsPrinter)
                        {
                            compilation.hooks.statsPrinter.tap("CompileThisCompilationPlugin_STAGE_ADDITIONS", (stats) =>
                            {
                                stats.hooks.print.for("asset.info.istanbulTagged").tap(
                                    "CompileProcessAssets_STAGE_ADDITIONS",
                                    (istanbulTagged, { green, formatFlag }) => {
                                        return istanbulTagged ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)("istanbul tagged")) : "";
                                    }
                                );
                            });
                        }
                    });
                });

                // compiler.hooks.compilation.tap("CompileThisCompilationPlugin_STAGE_ADDITIONAL", (compilation) =>
                // {
                //     // const cache = compilation.getCache("CompileThisCompilationPlugin"),
                //     //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                //     compilation.hooks.processAssets.tap(
                //     {
                //         name: "CompileProcessAssets_STAGE_ADDITIONAL",
                //         stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
                //     },
                //     (assets) =>
                //     {
                //         const entriesRgx = `(?:${Object.keys(wpConfig.entry).reduce((e, c) => `${!!c ? `${c}|` : c}${e}`, "")})`;
                //         Object.entries(assets).filter(a => new RegExp(entriesRgx).test(a[0])).forEach(a =>
                //         {
                //             const fileName = a[0],
                //                   { source, map } = a[1].sourceAndMap(),
                //                   content= source.toString();
                //             compilation.emitAsset(fileName, new compiler.webpack.sources.SourceMapSource(content, fileName, map));
                //         });
                //         if (compilation.hooks.statsPrinter)
                //         {
                //             compilation.hooks.statsPrinter.tap("CompileThisCompilationPlugin_STAGE_ADDITIONAL", (stats) =>
                //             {
                //                 stats.hooks.print.for("asset.info.copied").tap(
                //                     "CompileProcessAssets_STAGE_ADDITIONAL",
                //                     (copied, { green, formatFlag }) => {
                //                         return copied ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)("copied")) : "";
                //                     }
                //                 );
                //             });
                //         }
                //     });
                // });
            }
        };
    }
    return plugin;
};


/**
 * @function _upload
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

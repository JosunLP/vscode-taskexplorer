/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.istanbul
 */

const { createInstrumenter } = require("istanbul-lib-instrument");

/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function istanbul
 * @param {WpBuildEnvironment} env
 * @returns {WebpackPluginInstance | undefined}
 */
const istanbul = (env) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    // if (env.app.plugins.instrument !== false && env.build === "extension" && env.environment === "test")
    // {
    //     plugin =
    //     {
    //         apply: (compiler) =>
    //         {
    //             compiler.hooks.compilation.tap("CompileThisCompilationPlugin_STAGE_ADDITIONS", (compilation) =>
    //             {
    //                 // const cache = compilation.getCache("CompileThisCompilationPlugin"),
    //                 //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
    //                 compilation.hooks.processAssets.tap(
    //                 {
    //                     name: "CompileProcessAssets_STAGE_ADDITIONS",
    //                     stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
    //                 },
    //                 (assets) =>
    //                 {
    //                     const entriesRgx = `(?:${Object.keys(wpConfig.entry).reduce((e, c) => `${!!c ? `${c}|` : c}${e}`, "")})`;
    //                     const instrumenter = createInstrumenter(
    //                     {   // coverageGlobalScopeFunc: false,
    //                         // coverageGlobalScope: "window",
    //                         coverageVariable: "__coverage__",
    //                         preserveComments: true,
    //                         produceSourceMap: true,
    //                         autoWrap: true,
    //                         esModules: true,
    //                         compact: false,
    //                     });
    //                     Object.entries(assets).filter(a => new RegExp(entriesRgx).test(a[0])).forEach(a =>
    //                     {
    //                         // const shouldInstrument = testExclude.shouldInstrument(fileName);
    //                         // if (shouldInstrument)
    //                         // {
    //                         const fileName = a[0],
    //                               { source, map } = a[1].sourceAndMap(),
    //                               sourceMap = sanitizeSourceMap(map),
    //                               instrumented = instrumenter.instrumentSync(source.toString(), fileName, sourceMap);
    //                         compilation.updateAsset(fileName, new compiler.webpack.sources.RawSource(instrumented));
    //                         // }
    //                     });
    //                     // if (compilation.hooks.statsPrinter)
    //                     // {
    //                     //     compilation.hooks.statsPrinter.tap("CompileThisCompilationPlugin", (stats) =>
    //                     //     {
    //                     //         stats.hooks.print.for("asset.info.copied").tap(
    //                     //             "CompileProcessAssetsCompilationPlugin",
    //                     //             (copied, { green, formatFlag }) => {
    //                     //                 return copied ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)("copied")) : ""
    //                     //             }
    //                     //         );
    //                     //     });
    //                     // }
    //                 });
    //             });
    //         }
    //     };
    // }
    return plugin;
};


// const sanitizeSourceMap = (rawSourceMap) =>
// {
//     // Delete sourcesContent since it is optional and if it contains process.env.NODE_ENV vite will break when trying to replace it
//     const { sourcesContent, ...sourceMap } = rawSourceMap;
//     // JSON parse/stringify trick required for istanbul to accept the SourceMap
//     return JSON.parse(JSON.stringify(sourceMap));
// };


module.exports = istanbul;

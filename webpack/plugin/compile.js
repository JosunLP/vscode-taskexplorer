/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.compile
 */

const { join } = require("path");
const { copyFileSync } = require("fs");
const { getEntriesRegexString } = require("../utils/utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
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
    if (env.build === "extension")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.compilation.tap("CompileCompilationPlugin", (compilation) =>
                {
                    // const cache = compilation.getCache("CompileThisCompilationPlugin"),
                    //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                    if (env.environment === "test" && env.buildMode !== "debug")
                    {
                        istanbulTags(compiler, compilation, wpConfig);
                    }
                });
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
const dupHashFile = (assets, env) =>
{
    // const teModule = assets.find(a => a.startsWith("taskexplorer") && a.endsWith(".js"));
    // if (teModule) {
    //     copyFileSync(join(env.paths.dist, teModule.name), join(env.paths.dist, "taskexplorer.js"));
    // }

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
};



/**
 * @function istanbulTags
 * @param {WebpackCompiler} compiler
 * @param {WebpackCompilation} compilation
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const istanbulTags = (compiler, compilation, wpConfig) =>
{
    const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          name = `CompileCompilationPlugin${stage}`;
    compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
    {
        const entriesRgx = getEntriesRegexString(wpConfig);
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
            //                                new sources.RawSource(newContent)
            // );
            compilation.updateAsset(
                fileName,
                new compiler.webpack.sources.SourceMapSource(newContent, fileName, map),
                { ...info, istanbulTagged: true })
            ;
        });
    });
    statsPrinter("istanbulTagged", name, compilation);
};



/**
 * @function statsPrinter
 * @param {string} infoProp
 * @param {string} assetPluginName
 * @param {WebpackCompilation} compilation
 */
const statsPrinter = (infoProp, assetPluginName, compilation) =>
{
    if (compilation.hooks.statsPrinter)
    {
        compilation.hooks.statsPrinter.tap(assetPluginName, (stats) =>
        {
            stats.hooks.print.for(`asset.info.${infoProp}`).tap(
                assetPluginName,
                (istanbulTagged, { green, formatFlag }) => {
                    return istanbulTagged ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)(breakProp(infoProp))) : "";
                }
            );
        });
    }
};


/**
 * Break property name into separate spaced words at each camel cased character
 *
 * @param {string} prop
 * @returns {string}
 */
const breakProp = (prop) => prop.replace(/[A-Z]/g, (v) => ` ${v.toLowerCase()}`);


module.exports = compile;

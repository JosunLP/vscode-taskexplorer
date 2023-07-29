/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.compiletest
 */

const { getEntriesRegex, tapStatsPrinter } = require("../utils/utils");

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
const compiletest = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension" && env.environment === "test" && env.buildMode !== "debug")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.compilation.tap("CompileCompilationPlugin", (compilation) =>
                {
                    // const cache = compilation.getCache("CompileThisCompilationPlugin"),
                    //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                    istanbulTags(compiler, compilation, wpConfig);
                });
            }
        };
    }
    return plugin;
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
        const entriesRgx = getEntriesRegex(wpConfig);
        Object.entries(assets).filter(a => entriesRgx.test(a[0])).forEach(a =>
        {
            const fileName = a[0],
                  { source, map } = a[1].sourceAndMap(),
                  content= source.toString(),
                  regex = /\n[ \t]*module\.exports \= require\(/gm,
                  newContent = content.replace(regex, (v) => "/* istanbul ignore next */" + v),
                  info = compilation.getAsset(fileName)?.info;
            compilation.updateAsset(
                fileName,
                compiler.options.devtool ?
                    new compiler.webpack.sources.SourceMapSource(newContent, fileName, map) :
                    new compiler.webpack.sources.RawSource(newContent),
                { ...info, istanbulTagged: true }
            );
        });
    });
    tapStatsPrinter("istanbulTagged", name, compilation);
};


module.exports = compiletest;

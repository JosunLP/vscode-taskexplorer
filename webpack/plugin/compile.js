/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.compilation
 */

const { getEntriesRegex, tapStatsPrinter } = require("../utils/utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function compile
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const compile = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.app.plugins.compilation !== false && env.build === "extension" && env.environment === "test")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.compilation.tap("CompileCompilationPlugin", (compilation) =>
                {
                    // const cache = compilation.getCache("CompileThisCompilationPlugin"),
                    //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                    istanbulTags(compiler, compilation, env, wpConfig);
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
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const istanbulTags = (compiler, compilation, env, wpConfig) =>
{
    const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          name = `CompileCompilationPlugin${stage}`;
    compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
    {
        Object.entries(assets).filter(a => getEntriesRegex(wpConfig).test(a[0])).forEach(([ fileName, sourceInfo ]) =>
        {
            const { source, map } = sourceInfo.sourceAndMap(),
                  regex = /\n[ \t]*module\.exports \= require\(/gm,
                  newContent = source.toString().replace(regex, (v) => "/* istanbul ignore next */" + v),
                  info = compilation.getAsset(fileName)?.info || {};
            compilation.updateAsset(
                fileName,
                map && (compiler.options.devtool || env.app.plugins.sourcemaps) ?
                    new compiler.webpack.sources.SourceMapSource(newContent, fileName, map) :
                    new compiler.webpack.sources.RawSource(newContent),
                { ...info, istanbulTagged: true }
            );
        });
    });
    tapStatsPrinter("istanbulTagged", name, compilation);
};


module.exports = compile;

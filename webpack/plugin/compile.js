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
        Object.entries(assets).filter(([ file, _ ]) => getEntriesRegex(wpConfig).test(file)).forEach(([ file, sourceInfo ]) =>
        {
            const { source, map } = sourceInfo.sourceAndMap(),
                  regex = /\n[ \t]*module\.exports \= require\(/gm,
                  content = source.toString().replace(regex, (v) => "/* istanbul ignore next */" + v),
                  info = compilation.getAsset(file)?.info || {};
            compilation.updateAsset(
                file,
                map && (compiler.options.devtool || env.app.plugins.sourcemaps) ?
                    new compiler.webpack.sources.SourceMapSource(content, file, map) :
                    new compiler.webpack.sources.RawSource(content),
                { ...info, istanbulTagged: true }
            );
        });
    });
    tapStatsPrinter("istanbulTagged", name, compilation);
};


module.exports = compile;

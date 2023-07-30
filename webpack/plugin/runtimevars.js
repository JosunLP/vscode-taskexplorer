/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.define
 */

const webpack = require("webpack");
const { globalEnv } = require("../utils/global");
const { getEntriesRegex, tapStatsPrinter, isString, initGlobalEnvObject } = require("../utils/utils");

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
 * @returns {WebpackPluginInstance | webpack.DefinePlugin | undefined}
 */
const define = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | webpack.DefinePlugin | undefined} */
    let plugin;
    if (env.app.plugins.define && env.build === "extension")
    {
        initGlobalEnvObject("defines");
        // plugin = new webpack.DefinePlugin({
        //     `__WPBUILD__.contenthash.${chunkName}`: JSON.stringify(true)
        // });
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.compilation.tap("DefineCompilationPlugin", (compilation) =>
                {
                    // const cache = compilation.getCache("CompileThisCompilationPlugin"),
                    //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                    preprocess(compiler, compilation, env, wpConfig);
                    defineVars(compiler, compilation, env, wpConfig);
                });
            }
        };
    }
    return plugin;
};


/**
 * @function defineHashVars
 * @param {WebpackCompiler} compiler
 * @param {WebpackCompilation} compilation
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const preprocess = (compiler, compilation, env, wpConfig) =>
{
    const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
          name = `CompileCompilationPlugin${stage}`;
    compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
    {
        Object.entries(assets).forEach(asset =>
        {
            const fileName = asset[0],
                  info = compilation.getAsset(fileName)?.info;
            if (info && !info.copied && isString(info.contenthash))
            {
 // console.log("preprocess: " + fileName + " - " + info.contenthash);
                globalEnv.defines[fileName] = info.contenthash;
            }
        });
    });
};


/**
 * @function defineHashVars
 * @param {WebpackCompiler} compiler
 * @param {WebpackCompilation} compilation
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const defineVars = (compiler, compilation, env, wpConfig) =>
{
    const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          name = `CompileCompilationPlugin${stage}`;
    compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
    {
        const entriesRgx = getEntriesRegex(wpConfig, true, true);
        // Object.entries(globalEnv.defines).forEach((a) =>
        Object.entries(assets).filter(a => entriesRgx.test(a[0])).forEach((a) =>
        {
            const fileName = a[0],
                  info = compilation.getAsset(fileName)?.info;
            if (info) // && !info.copied)
            {
                const hash = /** @type {string} */(info.contenthash),
                      { source, map } = a[1].sourceAndMap();
                let content= source.toString();
                Object.entries(globalEnv.defines).forEach((define) =>
                {
                    const chunkName = define[0].replace(/\.[a-f0-9]{16,}\.js/, ""),
                          regex = new RegExp(`"__WPBUILD__.contenthash.${chunkName}" *(,|\r|\n)`, "gm");
                    content = content.replace(regex, (_v, g) =>`"${hash}"${g}`); // .replace(/""/g, '"');
// console.log(fileName + " : " + chunkName);
                });
                compilation.updateAsset(
                    fileName,
                    compiler.options.devtool ?
                        new compiler.webpack.sources.SourceMapSource(content, fileName, map) :
                        new compiler.webpack.sources.RawSource(content),
                    { ...info, definesSet: true }
                );
            }
        });
        // }
    });
    tapStatsPrinter("definesSet", name, compilation);
};


module.exports = define;

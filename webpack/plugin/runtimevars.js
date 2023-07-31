/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const webpack = require("webpack");
const WpBuildBasePlugin = require("./base");
const { globalEnv, getEntriesRegex, tapStatsPrinter, isString, initGlobalEnvObject } = require("../utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @class WpBuildRuntimeVarsPlugin
 */
class WpBuildRuntimeVarsPlugin extends WpBuildBasePlugin
{
    /**
     * @class
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        initGlobalEnvObject("runtimevars");
    }

    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) =>
        {
            this.compilation = compilation;
            this.cache = compilation.getCache(this.constructor.name);
            this.logger = compilation.getLogger(this.constructor.name);
            this.preprocess(compiler, compilation);
            this.defineVars(compiler, compilation);
        });
    }


    /**
     * @function Collects content hashes from compiled assets
     * @param {WebpackCompiler} compiler
     * @param {WebpackCompilation} compilation
     */
    preprocess(compiler, compilation)
    {
        const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
              name = `${this.constructor.name}${stage}`;
        compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
        {
            Object.entries(assets).forEach(([ file, _ ]) =>
            {
                const info = compilation.getAsset(file)?.info;
                if (info && !info.copied && isString(info.contenthash))
                {
                    globalEnv.runtimevars[file] = info.contenthash;
                }
            });
        });
    };


    /**
     * @function
     * @param {WebpackCompiler} compiler
     * @param {WebpackCompilation} compilation
     */
    defineVars(compiler, compilation)
    {
        const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
              name = `${this.constructor.name}${stage}`;
        compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
        {
            Object.entries(assets).filter(([ file, _ ]) => getEntriesRegex(this.options.wpConfig).test(file)).forEach(([ file, sourceInfo ]) =>
            {
                const info = compilation.getAsset(file)?.info || {},
                      hash = /** @type {string} */(info.contenthash),
                      { source, map } = sourceInfo.sourceAndMap();
                let content= source.toString();
                Object.entries(globalEnv.runtimevars).forEach((define) =>
                {
                    const hashDigestLength = compiler.options.output.hashDigestLength || this.options.wpConfig.output.hashDigestLength || 20;
                    const chunkName = define[0].replace(new RegExp(`\\.[a-z0-9]{${hashDigestLength}}\\.js`), ""),
                          regex = new RegExp(`(?:interface_[0-9]+\\.)?__WPBUILD__\\.contentHash(?:\\.|\\[")${chunkName}(?:"\\])? *(,|\r|\n)`, "gm");
                    content = content.replace(regex, (_v, g) =>`"${hash}"${g}`);
                });
                compilation.updateAsset(
                    file,
                    map && (compiler.options.devtool || this.options.env.app.plugins.sourcemaps) ?
                        new compiler.webpack.sources.SourceMapSource(content, file, map) :
                        new compiler.webpack.sources.RawSource(content),
                    { ...info, runtimeVars: true }
                );
            });
        });
        tapStatsPrinter("runtimeVars", name, compilation);
    };
}


/**
 * @function compile
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | webpack.DefinePlugin | undefined}
 */
const runtimevars = (env, wpConfig) =>
{
    if (env.app.plugins.runtimevars !== false && env.isExtension)
    {
        return new WpBuildRuntimeVarsPlugin({ env, wpConfig });
    }
};


/**
 * @module runtimevars
 */
module.exports = runtimevars;

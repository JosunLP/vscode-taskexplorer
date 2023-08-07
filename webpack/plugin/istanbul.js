/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/istanbul.js
 * @author Scott Meesseman
 */

const { apply, asArray } = require("../utils");
const WpBuildBasePlugin = require("./base");

/** @typedef {import("../types").WebpackAsset} WebpackAsset */
/** @typedef {import("../types").WebpackChunk} WebpackChunk */
/** @typedef {import("../types").WebpackSource} WebpackSource */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackAssetInfo} WebpackAssetInfo */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */


/**
 * @class WpBuildCompilePlugin
 */
class WpBuildIstanbulPlugin extends WpBuildBasePlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            performCodeCoverageTasks: {
                hook: "compilation",
                stage: "ADDITIONS",
                callback: this.istanbulTags.bind(this)
            }
        });
    }


    /**
     * @function
     * @private
     * @param {WebpackAssetInfo} info
     */
    info(info) { return apply(info || {}, { istanbulTagged: true }); }


    /**
     * @function
     * @private
     * @param {WebpackCompilationAssets} assets
     */
    istanbulTags(assets)
    {
		this.logger.write("istanbul ignore tag insertion for external requires");
		Object.entries(assets).filter(([ file, _ ]) => this.matchObject(file) && this.isEntryAsset(file)).forEach(([ file, _ ]) =>
		{
            this.logger.value("   update asset with tag insertion", file);
            this.compilation.updateAsset(file, (source) => this.source(file, source), this.info.bind(this));
        });
    }


    /**
     * @function
     * @private
     * @param {string} file
     * @param {WebpackSource} sourceInfo
     * @returns {WebpackSource}
     */
    source(file, sourceInfo)
    {
        let sourceCode = sourceInfo.source().toString();
        sourceCode = this.sourceIstanbulTags(sourceCode);
        return this.sourceObj(file, sourceCode, sourceInfo);
    }


    /**
     * @function
     * @private
     * @param {string} file
     * @param {string | Buffer} content
     * @param {WebpackSource} sourceInfo
     * @returns {WebpackSource}
     */
    sourceObj(file, content, sourceInfo)
    {
        const { source, map } = sourceInfo.sourceAndMap();
        return map && (this.compiler.options.devtool || this.env.app.plugins.sourcemaps) ?
               new this.compiler.webpack.sources.SourceMapSource(content, file, map, source) :
               new this.compiler.webpack.sources.RawSource(content);
    }


    /**
     * @function
     * @private
     * @param {string} sourceCode
     * @returns {string}
     */
    sourceIstanbulTags(sourceCode)
    {
        const regex = /\n[ \t]*module\.exports \= require\(/gm;
        return sourceCode.replace(regex, (v) => "/* istanbul ignore next */" + v);
    }


    // /**
    //  * @function
    //  * @param {WebpackSource} sourceInfo
    //  * @param {WebpackCompiler} compiler
    //  */
    // source2(sourceInfo, compiler)
    // {
    //     // let cached = cache.get(old);
    //     // if (!cached || cached.comment !== comment) {
    //     //     const source = options.footer
    //     //         ? new ConcatSource(old, "\n", comment)
    //     //         : new ConcatSource(comment, "\n", old);
    //     //     cache.set(old, { source, comment });
    //     //     return source;
    //     // }
    //     // return cached.source;
    //     const { source, map } = osourceInfold.sourceAndMap(),
    //           regex = /\n[ \t]*module\.exports \= require\(/gm,
    //           content = source.toString().replace(regex, (v) => "/* istanbul ignore next */" + v);
    //     return map && (compiler.options.devtool || this.env.app.plugins.sourcemaps) ?
    //            new compiler.webpack.sources.SourceMapSource(content, file, map) :
    //            new compiler.webpack.sources.RawSource(content);
    // }

    // const { createInstrumenter } = require("istanbul-lib-instrument");
    //
    // /** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
    // /** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
    // /** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
    //
    //
    // /**
    //  * @function istanbul
    //  * @param {WpBuildEnvironment} env
    //  * @returns {WebpackPluginInstance | undefined}
    //  */
    // const istanbul = (env) =>
    // {
    //     /** @type {WebpackPluginInstance | undefined} */
    //     let plugin;
    //     // if (env.app.plugins.instrument !== false && env.build === "extension" && env.environment === "test")
    //     // {
    //     //     plugin =
    //     //     {
    //     //         apply: (compiler) =>
    //     //         {
    //     //             compiler.hooks.compilation.tap("CompileThisCompilationPlugin_STAGE_ADDITIONS", (compilation) =>
    //     //             {
    //     //                 // const cache = compilation.getCache("CompileThisCompilationPlugin"),
    //     //                 //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
    //     //                 compilation.hooks.processAssets.tap(
    //     //                 {
    //     //                     name: "CompileProcessAssets_STAGE_ADDITIONS",
    //     //                     stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
    //     //                 },
    //     //                 (assets) =>
    //     //                 {
    //     //                     const entriesRgx = `(?:${Object.keys(wpConfig.entry).reduce((e, c) => `${!!c ? `${c}|` : c}${e}`, "")})`;
    //     //                     const instrumenter = createInstrumenter(
    //     //                     {   // coverageGlobalScopeFunc: false,
    //     //                         // coverageGlobalScope: "window",
    //     //                         coverageVariable: "__coverage__",
    //     //                         preserveComments: true,
    //     //                         produceSourceMap: true,
    //     //                         autoWrap: true,
    //     //                         esModules: true,
    //     //                         compact: false,
    //     //                     });
    //     //                     Object.entries(assets).filter(a => new RegExp(entriesRgx).test(a[0])).forEach(a =>
    //     //                     {
    //     //                         // const shouldInstrument = testExclude.shouldInstrument(fileName);
    //     //                         // if (shouldInstrument)
    //     //                         // {
    //     //                         const fileName = a[0],
    //     //                               { source, map } = a[1].sourceAndMap(),
    //     //                               sourceMap = sanitizeSourceMap(map),
    //     //                               instrumented = instrumenter.instrumentSync(source.toString(), fileName, sourceMap);
    //     //                         compilation.updateAsset(fileName, new compiler.webpack.sources.RawSource(instrumented));
    //     //                         // }
    //     //                     });
    //     //                     // if (compilation.hooks.statsPrinter)
    //     //                     // {
    //     //                     //     compilation.hooks.statsPrinter.tap("CompileThisCompilationPlugin", (stats) =>
    //     //                     //     {
    //     //                     //         stats.hooks.print.for("asset.info.copied").tap(
    //     //                     //             "CompileProcessAssetsCompilationPlugin",
    //     //                     //             (copied, { green, formatFlag }) => {
    //     //                     //                 return copied ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)("copied")) : ""
    //     //                     //             }
    //     //                     //         );
    //     //                     //     });
    //     //                     // }
    //     //                 });
    //     //             });
    //     //         }
    //     //     };
    //     // }
    // //     return plugin;
    // // };


    // const sanitizeSourceMap = (rawSourceMap) =>
    // {
    //     // Delete sourcesContent since it is optional and if it contains process.env.NODE_ENV vite will break when trying to replace it
    //     const { sourcesContent, ...sourceMap } = rawSourceMap;
    //     // JSON parse/stringify trick required for istanbul to accept the SourceMap
    //     return JSON.parse(JSON.stringify(sourceMap));
    // };
}

/**
 * @function compile
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildIstanbulPlugin | undefined}
 */
const istanbul = (env) =>
    (env.app.plugins.compile !== false && env.isExtensionTests ? new WpBuildIstanbulPlugin({ env }) : undefined);


module.exports = istanbul;

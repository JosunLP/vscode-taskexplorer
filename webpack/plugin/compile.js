/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.compile
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
class WpBuildCompilePlugin extends WpBuildBasePlugin
{
    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            istanbul: {
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
     * @param {WebpackCompilationAssets} _assets
     */
    istanbulTags(_assets)
    {
		this.env.logger.write("perform istanbul tags tasks");
        for (const chunk of asArray(this.compilation.chunks).filter(c => c.canBeInitial()))
        {
            for (const file of asArray(chunk.files).filter(f => this.matchObject(f)))
            {
				this.env.logger.value("   update asset", file);
                this.compilation.updateAsset(file, (source) => this.source(file, source), this.info.bind(this));
            }
        }
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
}

/**
 * @function compile
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildCompilePlugin | undefined}
 */
const compile = (env) =>
    (env.app.plugins.compile !== false && env.isExtensionTests ? new WpBuildCompilePlugin({ env }) : undefined);


module.exports = compile;

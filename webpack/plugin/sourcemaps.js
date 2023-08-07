/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.sourcemaps
 *
 * IMPORTANT NOTE:
 *
 * This module contains project specifc code and the sync script should be modified
 * if necessary when changes are made to this file.
 *
 * TODO - Make it not project specific somehow
 */

const webpack = require("webpack");
const { apply, isString } = require("../utils");
// const { Compilation } = require("webpack");
const WpBuildBasePlugin = require("./base");
// const CopyInMemoryPlugin = require("copy-asset-in-memory-webpack-plugin");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */


class WpBuildSourceMapPlugin extends WpBuildBasePlugin
{
	/**
	 * @class WpBuildCopyPlugin
	 * @param {WpBuildPluginOptions} options Plugin options to be applied
	 */
	constructor(options)
    {
        super(apply(options, { plugins: WpBuildSourceMapPlugin.vendorPlugins(options.env), registerVendorPluginsFirst: true }));
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		if (this.env.isExtension)
		{
			this.onApply(compiler,
			{
				renameSourceMaps: {
					hook: "compilation",
					stage: "DEV_TOOLING",
					hookCompilation: "processAssets",
					callback: this.renameMap.bind(this)
				}
			});
		}
    }


    /**
     * @function
     * @private
     * @param {WebpackCompilationAssets} assets
     */
    renameMap = (assets) =>
    {
        this.logger.write("rename sourcemaps with entry module contenthash", 1);
        // Object.entries(assets).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, source ]) =>
		// {
		// 	this.logger.value("check for file sourcemap attribute", file);
		// 	const srcCode = source.source(),
        //           asset = this.compilation.getAsset(file);
		// 	if (asset && asset.info.related && isString(asset.info.related.sourceMap))
		// 	{
        //         const entryHash = this.env.state.hash.next[this.fileNameStrip(file, true)],
        //               newFile = this.fileNameStrip(asset.info.related.sourceMap).replace(".js.map", `.${entryHash}.js.map`);
		// 		this.logger.write(`found sourcemap info, rename using entry module contenthash italic(${entryHash})`);
		// 		this.logger.value("   current file", asset.info.related.sourceMap, 3);
		// 		this.logger.value("   new file", newFile, 3);
		// 		this.logger.value("   asset info", JSON.stringify(asset.info), 4);
        //         asset.info.related.sourceMap = newFile;
		// 		// const newInfo = { ...asset.info, sourceFilename: newFile };
		// 		// this.compilation.renameAsset(file, newFile);
		// 		// const srcAsset = this.compilation.getAsset(newFile.replace(".map", ""));
		// 		// if (srcAsset && srcAsset.info.related?.sourceMap)
		// 		// {
		// 		// 	this.logger.value("   update entry asset with new sourcemap filename", file);
        //         //     this.logger.value("   entry asset info", JSON.stringify(srcAsset.info), 1);
        //         //     // const newInfo = { ...asset.info };
        //         //     srcAsset.info.related.sourceMap = newFile;
        //         //     this.compilation.updateAsset(srcAsset.name, srcAsset.source, srcAsset.info);
        //         // }
		// 	}
		// });
		Object.entries(assets).filter(([ file, _ ]) => file.endsWith(".map")).forEach(([ file, sourceInfo ]) =>
		{
			const asset = this.compilation.getAsset(file);
			if (asset)
			{
                const entryHash = this.env.state.hash.next[this.fileNameStrip(file, true)],
                      newFile = this.fileNameStrip(file).replace(".js.map", `.${entryHash}.js.map`);
				this.logger.write(`found sourcemap ${asset.name}, rename using contenthash italic(${entryHash})`, 2);
				this.logger.value("   current file", file, 3);
				this.logger.value("   new file", newFile, 3);
				this.logger.value("   asset info", JSON.stringify(asset.info), 4);
				this.compilation.renameAsset(file, newFile);
				const srcAsset = this.compilation.getAsset(newFile.replace(".map", ""));
				if (srcAsset && srcAsset.info.related && srcAsset.info.related.sourceMap)
				{
					this.logger.write("   update source entry asset with new sourcemap filename", 2);
                    this.logger.value("   source entry asset info", JSON.stringify(srcAsset.info), 4);
                    const sources = this.compiler.webpack.sources,
                          sourceMap = sourceInfo.map(),
                          { source, map } = srcAsset.source.sourceAndMap(),
                          newInfo = apply({ ...srcAsset.info }, { related: { ...srcAsset.info.related, sourceMap: newFile }});
                    this.compilation.updateAsset(srcAsset.name, new sources.SourceMapSource(source, srcAsset.name, map), newInfo);
                }
			}
		});
    };


	/**
	 * @function
	 * @private
	 * @param {WpBuildEnvironment} env
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static vendorPlugins = (env) =>
	{
		return [
        {
            ctor: webpack.SourceMapDevToolPlugin,
            options: {
                test: /\.(js|jsx)($|\?)/i,
                exclude: !env.isTests ? /(?:node_modules|(?:vendor|runtime|tests)(?:\.[a-f0-9]{16,})?\.js)/ :
                                        /(?:node_modules|(?:vendor|runtime)(?:\.[a-f0-9]{16,})?\.js)/,
                // filename: "[name].js.map",
                filename: "[name].[contenthash].js.map",
                //
                // The bundled node_modules will produce reference tags within the main entry point
                // files in the form:
                //
                //     external commonjs "vscode"
                //     external-node commonjs "crypto"
                //     ...etc...
                //
                // This breaks the istanbul reporting library when the tests have completed and the
                // coverage report is being built (via nyc.report()).  Replace the quote and space
                // characters in this external reference name with filename firiendly characters.
                //
                /** @type {any} */moduleFilenameTemplate: (/** @type {any} */info) =>
                {
                    if ((/[\" \|]/).test(info.absoluteResourcePath)) {
                        return info.absoluteResourcePath.replace(/\"/g, "").replace(/[ \|]/g, "_");
                    }
                    return `${info.absoluteResourcePath}`;
                },
                fallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
            }
        }];
        // {
        //     ctor: CopyInMemoryPlugin,
        //     options: {
        //         test: /.js.map$/,
        //         stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE, // Default
        //         to: (fileName) => fileName.replace(/[a-f0-9]{16,}\./, env.state.hash.next[fileName.replace(/[a-f0-9]{16,}\.js/, "")] + "."),
        //         deleteOriginalAssets: true
        //     }
        // }];
    };

}

/**
 * @param {WpBuildEnvironment} env
 * @returns {(webpack.SourceMapDevToolPlugin | WpBuildSourceMapPlugin)[]}
 */
const sourcemaps = (env) =>
    env.app.plugins.sourcemaps !== false && env.build !== "tests" && env.build !== "webview" && env.build !== "types" ?  new WpBuildSourceMapPlugin({ env }).getPlugins() : [];


module.exports = sourcemaps;

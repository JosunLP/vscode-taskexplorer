/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/copy.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const WpBuildBasePlugin = require("./base");
const CopyPlugin = require("copy-webpack-plugin");
const { join, posix, isAbsolute, relative, normalize } = require("path");
const { isString, apply } = require("../utils/utils");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */


class WpBuildCopyPlugin extends WpBuildBasePlugin
{
	/**
	 * @class WpBuildCopyPlugin
	 * @param {WpBuildPluginOptions} options Plugin options to be applied
	 */
	constructor(options)
    {
        super(apply(options, { plugins: WpBuildCopyPlugin.vendorPlugins(options.apps, options.env) }));
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		if (this.env.isMain)
		{
			this.onApply(compiler,
			{
				copyModulesWithoutFilenameHash: {
					hook: "compilation",
					stage: "ADDITIONAL",
					statsProperty: "copied",
					hookCompilation: "processAssets",
					callback: this.copyEntryModulesNoHash.bind(this)
				},
				attachSourceMapsToCopiedModules: {
					hook: "compilation",
					stage: "DEV_TOOLING",
					hookCompilation: "processAssets",
					callback: this.sourcemap.bind(this)
				}
			});
		}
    }


	/**
	 * @function
	 * @private
	 * @async
	 * @param {WebpackCompilationAssets} assets
	 */
	copyEntryModulesNoHash(assets)
	{
		this.logger.write("create copies of entry modules named without hash", 1);
		for (const [ file ] of Object.entries(assets).filter(([ file ]) => this.isEntryAsset(file)))
		{
			const ccFile = this.fileNameStrip(file),
				  dstAsset = this.compilation.getAsset(ccFile);
			if (!dstAsset)
			{
				const srcAsset = this.compilation.getAsset(file);
				if (srcAsset)
				{
					this.logger.write("   check persistent cache for previous contenthash", 3);
					const persistedCache = this.cache.get(),
						  immutable = srcAsset.info.contenthash === persistedCache[ccFile];
					if (immutable)
					{
						this.logger.write("   copied asset content is italic(unchanged)", 3);
					}
					else {
						this.logger.write("   copied asset content has italic(changed)", 3);
						persistedCache[ccFile] = srcAsset.info.contenthash;
						this.cache.set(persistedCache);
					}
					const sources = this.compiler.webpack.sources,
						  newInfo = { copied: true, immutable, sourceFilename: srcAsset.name, javascriptModule: false };
					 	  // srcAssetInfo = merge({}, srcAsset.info),
					      // newInfo = { ...srcAssetInfo,  copied: true, immutable, sourceFilename: srcAsset.name, javascriptModule: false };
					if (immutable) {
						newInfo.contenthash = srcAsset.info.contenthash;
					}
					this.logger.value("   emit copied asset", ccFile, 2);
					this.compilation.emitAsset(ccFile, new sources.RawSource(srcAsset.source.source()), newInfo);
				}
			}
		}
	}


    /**
     * @function
     * @private
     * @param {WebpackCompilationAssets} assets
     */
    sourcemap = (assets) =>
    {
		this.logger.write("attach sourcemap to copied assets", 1);
		Object.entries(assets).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
		{
			this.logger.value("check for file copied attribute with no attached sourcemap", file);
			const asset = this.compilation.getAsset(file);
			if (asset && asset.info.copied && !asset.info.related?.sourceMap)
			{
				const chunkName = this.fileNameStrip(file, true),
					  srcAssetFile = `${chunkName}.${this.env.state.hash.next[chunkName]}.js`,
					  srcAsset = this.compilation.getAsset(srcAssetFile);
				this.logger.value("   copied file without sourcemap", true, 2);
				this.logger.value("   chunk name", srcAssetFile, 3);
				this.logger.value("   source asset filename", srcAssetFile, 3);
				this.logger.value("   source asset found", !!srcAsset, 3);
				this.logger.value("   source asset has sourcemap", !!srcAsset?.info.related?.sourceMap, 3);
				if (srcAsset && srcAsset.info.related?.sourceMap)
				{
					this.logger.value("   update copied asset with sourcemap", file, 3);
					const newInfo = apply({ ...asset.info }, { related: { sourceMap: srcAsset.info.related.sourceMap }});
					this.compilation.updateAsset(file, srcAsset.source, newInfo);
				}
			}
		});
    };


	/**
	 * @function
	 * @private
	 * @param {string[]} apps
	 * @param {WpBuildEnvironment} env
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static vendorPlugins = (apps, env) =>
	{
		/** @type {WpBuildPluginVendorOptions[]} */
		const plugins = [],
			  psxBuildPath = env.paths.build.replace(/\\/g, "/"),
			  psxBasePath = env.paths.base.replace(/\\/g, "/"),
			  psxBaseCtxPath = posix.join(psxBasePath, "res");

		if (env.app.plugins.copy !== false)
		{
			if (env.build === "webview")
			{
				/** @type {CopyPlugin.Pattern[]} */
				const patterns = [];
				apps.filter((app) => existsSync(join(env.paths.base, app, "res"))).forEach(
					(app) => patterns.push(
					{
						from: posix.join(psxBasePath, app, "res", "*.*"),
						to: posix.join(psxBuildPath, "res", "webview"),
						context: posix.join(psxBasePath, app, "res")
					})
				);
				if (existsSync(join(env.paths.base, "res")))
				{
					patterns.push({
						from: posix.join(psxBasePath, "res", "*.*"),
						to: posix.join(psxBuildPath, "res", "webview"),
						context: psxBaseCtxPath
					});
				}
				if (patterns.length > 0) {
					plugins.push(({ ctor: CopyPlugin, options: { patterns }}));
				}
			}
			else if (env.isMain && env.wpc.mode === "production" && env.app.publicInfoProject)
			{   //
				// Copy resources to public `info` sub-project during compilation
				//
				let psxDirInfoProj;
				if (isString(env.app.publicInfoProject))
				{
					const infoPath = /** @type {string} */(env.app.publicInfoProject);
					if (isAbsolute(infoPath)) {
						psxDirInfoProj = infoPath;
					}
					else {
						psxDirInfoProj = posix.resolve(posix.join(psxBuildPath, infoPath));
					}
				}
				else /* env.app.publicInfoProject === true */ {
					psxDirInfoProj = posix.resolve(posix.join(psxBuildPath, "..", `${env.app.name}-info`));
				}
				plugins.push({
					ctor: CopyPlugin,
					options:
					{
						patterns: [
						{
							from: posix.join(psxBasePath, "res", "img", "**"),
							to: posix.join(psxDirInfoProj, "res"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "res", "readme", "*.png"),
							to: posix.join(psxDirInfoProj, "res"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "doc", ".todo"),
							to: posix.join(psxDirInfoProj, "doc"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "res", "walkthrough", "welcome", "*.md"),
							to: posix.join(psxDirInfoProj, "doc"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "*.md"),
							to: posix.join(psxDirInfoProj),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "LICENSE*"),
							to: posix.join(psxDirInfoProj),
							context: psxBaseCtxPath
						}]
					}
				});
			}
		}

		return plugins;
	};

}


/**
 * @function
 * @param {string[]} apps
 * @param {WpBuildEnvironment} env
 * @returns {(CopyPlugin | WpBuildCopyPlugin)[]}
 */
const copy = (apps, env) =>
	env.app.plugins.copy !== false && env.build !== "tests" && env.build !== "webview" ? new WpBuildCopyPlugin({ env, apps }).getPlugins() : [];


module.exports = copy;

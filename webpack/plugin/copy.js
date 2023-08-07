/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/copy.js
 * @author Scott Meesseman
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
					async: true,
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
	 * @param {WebpackCompilationAssets} assets
	 */
	async copyEntryModulesNoHash(assets)
	{
		this.logger.write("create copies of entry modules named without hash", 1);
		for (const [ file, sourceInfo ] of Object.entries(assets).filter(([ file ]) => this.isEntryAsset(file)))
		{
			const ccFile = this.fileNameStrip(file),
				  absFile = this.compilation.getPath(file),
				  sourceFilename = file, // normalize(relative(this.compiler.context, absFile)),
				  dstAsset = this.compilation.getAsset(ccFile);
			if (!dstAsset)
			{
console.log("1");
				const srcAsset = this.compilation.getAsset(file);
				if (srcAsset)
				{
console.log("2");
					const srcAssetInfo = apply({}, srcAsset.info),
						  sources = this.compiler.webpack.sources,
					      newInfo = { ...srcAssetInfo, copied: true, sourceFilename };
					this.logger.value("   emit copied asset", ccFile, 2);
console.log("2.1: " + srcAsset.info.contenthash);
console.log("2.2: " + sourceInfo.source().toString().substring(sourceInfo.source().toString().length - 100));
					this.compilation.emitAsset(ccFile, new sources.RawSource(sourceInfo.source()), newInfo);
					try {
						await this.wpCacheCompilation.storePromise(absFile, null, { hash: srcAsset.info.contenthash });
					}
					catch (e) {
						this.handleError(e, "failed to cache copied asset");
						return;
					}
				}
			}
			else
			{
console.log("3");
				let cacheEntry;
				this.logger.write(`getting cache for '${absFile}`);
				try {
					cacheEntry = await this.wpCacheCompilation.getPromise(absFile/* `${srcFile}|${id}`*/, null);
console.log("4");
				}
				catch (e) {
					this.compilation.errors.push(e);
					return;
				}
				if (cacheEntry)
				{
console.log("!!!! IS CACHED");
				}
				else {
console.log("!!!! NOTTTTTT CACHED");
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
				this.logger.write("   found copied file without sourcemap, retrieve source asset", 3);
				const srcAsset = this.compilation.getAsset(file.replace(".js", `.${asset.info.contenthash}.js`));
				if (srcAsset && srcAsset.info.related?.sourceMap)
				{
					this.logger.value("   update copied asset with sourcemap", file);
					const newInfo = { ...srcAsset.info, copied: true, sourceFilename: file };
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

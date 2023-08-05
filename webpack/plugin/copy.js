/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.copy
 */

const { existsSync } = require("fs");
const WpBuildBasePlugin = require("./base");
const CopyPlugin = require("copy-webpack-plugin");
const { join, posix, isAbsolute } = require("path");
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
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		if (this.env.isExtension)
		{
			this.onApply(compiler,
			{
				dupMain: {
					hook: "compilation",
					stage: "ADDITIONAL",
					statsProperty: "copied",
					callback: this.entryModulesNoHash.bind(this)
				}
			});
		}
    }

	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} assets
	 */
	entryModulesNoHash(assets)
	{
		const entriesRgx = WpBuildBasePlugin.getEntriesRegex(this.wpConfig);
		this.logger.write("create copies of entry modules named without hash");
		Object.entries(assets).filter(([ file, _ ]) => entriesRgx.test(file)).forEach(([ file, sourceInfo ]) =>
		{
			const source = sourceInfo.source(),
				  hashDigestLength = this.compiler.options.output.hashDigestLength ||  this.env.wpc.output.hashDigestLength || 20,
				  ccFileName = file.replace(new RegExp(`\\.[a-f0-9]{${hashDigestLength}}`), ""),
				  dstAsset = this.compilation.getAsset(ccFileName),
				  srcAsset = this.compilation.getAsset(file),
				  srcAssetInfo = apply({}, srcAsset?.info),
				  newInfo = { ...srcAssetInfo, copied: true, sourceFilename: file };
			// let cacheEntry;
			// this.logger.debug(`getting cache for '${absoluteFilename}'...`);
			// try {
			// 	cacheEntry = this.cache.get(`${sourceFilename}|${index}`, null, () => {});
			// }
			// catch (/** @type {WebpackError} */e) {
			// 	this.compilation.errors.push(e);
			// 	return;
			// }
			if (!dstAsset)
			{
				this.logger.value("   emit copied asset", ccFileName);
				this.compilation.emitAsset(ccFileName, new this.compiler.webpack.sources.RawSource(source), newInfo);
			}
			else if (this.options.force) {
				this.logger.value("   update copied asset", ccFileName);
				this.compilation.updateAsset(ccFileName, new this.compiler.webpack.sources.RawSource(source), newInfo);
			}
		});
	}


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
			else if (env.isExtension && env.wpc.mode === "production" && env.app.publicInfoProject)
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
 * @returns {(CopyPlugin | WpBuildCopyPlugin | WebpackPluginInstance)[]}
 */
const copy = (apps, env) =>
{
	return env.app.plugins.copy !== false ? new WpBuildCopyPlugin({ env, apps }).getPlugins() : [];
};


module.exports = copy;

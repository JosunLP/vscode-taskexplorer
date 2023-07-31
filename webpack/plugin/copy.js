/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.copy
 */

const { existsSync } = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const { join, posix, isAbsolute } = require("path");
const { getEntriesRegex, tapStatsPrinter, isString, apply } = require("../utils/utils");
const WpBuildBasePlugin = require("./base");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */


/**
 * @class WpBuildRuntimeVarsPlugin
 */
class WpBuildCopyPlugin extends WpBuildBasePlugin
{

    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		this.onApply(compiler);
        compiler.hooks.compilation.tap(
			this.constructor.name,
			(compilation) =>
			{
				const stage = this.compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
					  name = `${this.constructor.name}${stage}`;
				compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
				{
					this.onCompilation(name, compilation);
					this.dupMainEntryFilesNoHash(assets);
				});
				tapStatsPrinter("copied", name, compilation);
			}
		);
    }


	/**
	 * @function
	 * @param {WebpackCompilationAssets} assets
	 */
	dupMainEntryFilesNoHash(assets)
	{
		const entriesRgx = getEntriesRegex(this.options.wpConfig);
		Object.entries(assets).filter(([ file, _ ]) => entriesRgx.test(file)).forEach(([ file, sourceInfo ]) =>
		{
			const source = sourceInfo.source(),
				  hashDigestLength = this.compiler.options.output.hashDigestLength ||  this.options.wpConfig.output.hashDigestLength || 20,
				  ccFileName = file.replace(new RegExp(`\\.[a-z0-9]{${hashDigestLength}}`), ""),
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
				this.compilation.emitAsset(ccFileName, new this.compiler.webpack.sources.RawSource(source), newInfo);
			}
			else if (this.options.force) {
				this.compilation.updateAsset(ccFileName, new this.compiler.webpack.sources.RawSource(source), newInfo);
			}
		});
	}

}


/**
 * @function
 * @param {string[]} apps
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {(CopyPlugin | WpBuildCopyPlugin)[]}
 */
const copy = (apps, env, wpConfig) =>
{
	/** @type {(CopyPlugin | WpBuildCopyPlugin)[]} */
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
			apps.filter(app => existsSync(join(env.paths.base, app, "res"))).forEach(
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
				plugins.push(new CopyPlugin({ patterns }));
			}
		}
		else if (env.isExtension)
		{
			//
			// Make a copy of the main module when it has been compiled, without the content hash
			// in the filename.
			//
			plugins.push(new WpBuildCopyPlugin({ env, wpConfig, force: true }));
			//
			// Copy resources to public `info` sub-project during compilation
			//
			if (wpConfig.mode === "production" && env.app.publicInfoProject)
			{
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
				plugins.push(
					new CopyPlugin(
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
					})
				);
			}
		}
	}

	return plugins;
};


module.exports = copy;

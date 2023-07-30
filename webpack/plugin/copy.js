/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.copy
 */

const { existsSync } = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const { join, posix, isAbsolute } = require("path");
const { getEntriesRegex, tapStatsPrinter, isString } = require("../utils/utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {string[]} apps
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {(CopyPlugin | WebpackPluginInstance)[]}
 */
const copy = (apps, env, wpConfig) =>
{
	/** @type {(CopyPlugin | WebpackPluginInstance)[]} */
	const plugins = [],
		  /** @type {CopyPlugin.Pattern[]} */
		  patterns = [],
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
		else if (env.build === "extension" || env.build === "browser")
		{
			//
			// Make a copy of the main module when it has been compiled, without the content hash
			// in the filename.
			//
			plugins.push({
				apply: (/** @type {WebpackCompiler} */compiler) =>
				{
					compiler.hooks.compilation.tap(
						"CompileCompilationPlugin",
						(compilation) => dupMainEntryFilesNoHash(compiler, compilation, env, wpConfig)
					);
				}
			});
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
				else {
					psxDirInfoProj = posix.resolve(posix.join(psxBuildPath, "..", `${env.app.name}-info`));
				}
				plugins.push(new CopyPlugin(
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
				}));
			}
		}
	}

	return plugins;
};


/**
 * @function dupMainEntryFilesNoHash
 * @param {WebpackCompiler} compiler
 * @param {WebpackCompilation} compilation
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const dupMainEntryFilesNoHash = (compiler, compilation, env, wpConfig) =>
{
    const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          name = `CompileCompilationPlugin${stage}`;
    compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
    {
        const entriesRgx = getEntriesRegex(wpConfig);
        Object.entries(assets).filter(a => entriesRgx.test(a[0])).forEach(a =>
        {
            const fileName = a[0],
                  content= a[1].source.toString(),
                  info = compilation.getAsset(fileName)?.info || {},
                  cpFileName = fileName.replace(/\.[a-z0-9]{16,}/, "");
            compilation.emitAsset(
                cpFileName,
                new compiler.webpack.sources.SourceMapSource(content, cpFileName, a[1].map),
                { ...info, copied: true , immutable: false }
            );
        });
    });
    tapStatsPrinter("copied", name, compilation);
};


module.exports = copy;

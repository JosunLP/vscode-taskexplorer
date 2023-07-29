/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.copy
 */

const { existsSync } = require("fs");
const { join, posix } = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { getEntriesRegex, tapStatsPrinter } = require("../utils/utils");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {string[]} apps
 * @param {WebpackEnvironment} env
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

	if (env.app.plugins.copy)
	{
		if (env.build === "webview")
		{
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
		}
		else if ((env.build === "extension" || env.build === "browser") && env.buildMode === "release")
		{   //
			// NOTE THAT THIS F'NG COPYPLUGIN BLOWS F'NG BALLS.  REALLY? COULD YOU HAVE MADE
			// SOMETHING SOOO SIMPLE ANY MORE COMPLICATED??!?! FIND A NEW CAREER MY FRIEND, JEBUS.
			// ALMOST AS BAD AS THAT DUMB **** WHO INCLUDED THE ENTIRE MOMENT PACKAGE FOR ONE
			// GOD DAMN TWO-LINE FUNCTION, IN WHATEVER THAT CRAP PACKAGE WAS FOR PARSING PIPENV TASKS.
			//
			// SOOOOO, LET'S DO WHAT THE THOUSANDS OF LINES OF CODE IN THE CRAP COPY PLUGIN TRIES TO DO
			// IN OH MAYBE 30-ish LINES OR LESS...
			//
			plugins.push({
				apply: (/** @type {WebpackCompiler} */compiler) =>
				{
					compiler.hooks.compilation.tap(
						"CompileCompilationPlugin",
						(compilation) => dupMainEntryFilesNoHash(compiler, compilation, wpConfig)
					);
				}
			});

			if (wpConfig.mode === "production")
			{
				const psxDirInfoProj = posix.resolve(posix.join(psxBuildPath, "..", `${env.app.name}-info`));
				patterns.push(
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
				});
			}
		}

		if (patterns.length > 0) {
			plugins.push(new CopyPlugin({ patterns }));
		}
	}

	return plugins;
};


/**
 * @function dupMainEntryFilesNoHash
 * @param {WebpackCompiler} compiler
 * @param {WebpackCompilation} compilation
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const dupMainEntryFilesNoHash = (compiler, compilation, wpConfig) =>
{
    const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          name = `CompileCompilationPlugin${stage}`;
    compilation.hooks.processAssets.tap({ name, stage }, (assets) =>
    {
        const entriesRgx = getEntriesRegex(wpConfig);
        Object.entries(assets).filter(a => entriesRgx.test(a[0])).forEach(a =>
        {
            const fileName = a[0],
                  { source, map } = a[1].sourceAndMap(),
                  content= source.toString(),
                  info = compilation.getAsset(fileName)?.info,
                  cpFileName = fileName.replace(/\.[a-z0-9]{16,}/, "");
            compilation.emitAsset(
                cpFileName,
                new compiler.webpack.sources.SourceMapSource(content, cpFileName, map),
                { ...info, copied: true }
            );
        });
    });
    tapStatsPrinter("copied", name, compilation);
};


module.exports = copy;

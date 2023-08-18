/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/testsuite.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const WpBuildTscPlugin = require("./tsc")
const { WebpackError } = require("webpack");
const {readFile, unlink, access } = require("fs/promises");
const { join, relative, dirname, isAbsolute, resolve } = require("path");;
const { findFiles, getTsConfig, WpBuildError, findTsConfig } = require("../utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("../types").WebpackAssetInfo} WebpackAssetInfo */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WebpackCompilationParams} WebpackCompilationParams */


class WpBuildTestSuitePlugin extends WpBuildTscPlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
			buildTestsSuite: {
				async: true,
                hook: "afterCompile",
                // hook: "compilation",
				// stage: "ADDITIONAL",
				statsProperty: "tests",
				statsPropertyColor: "magenta",
                callback: this.testsuite.bind(this)
            }
        });
    }


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilation} compilation
	 */
	async testsuite(compilation)
	{
		this.app.logger.write("build test suite", 1);
		this.onCompilation(compilation);

		const testsDir = join(this.app.getDistPath(), "test");

		const tsConfigFile = findTsConfig(this.app);
		if (!tsConfigFile)
		{
			const eMsg = "Could not locate tsconfig file for tests suite - must be **/tests?/tsconfig.* or **/tsconfig.tests?.json";
			this.handleError(new WebpackError(eMsg));
			this.logger.warning("consider possible solutions:");
			this.logger.warning("   (1) rename test suite config file according to convention");
			this.logger.warning("   (2) disable testsuite plugin in italic(.wsbuildrc.plugins.testsuite)");
			return;
		}

		this.app.logger.value("   found test suite tsconfig file", tsConfigFile, 2);

		if (!existsSync(testsDir))
		{
			this.app.logger.write("   checking for tsbuildinfo file path", 3);
			const tsConfig = getTsConfig(tsConfigFile);
			if (!tsConfig) {
				throw WpBuildError.getErrorMissing("tsconfig file", "exports/rules.js", this.app.wpc);
			}
			let buildInfoFile = tsConfig.json.compilerOptions.tsBuildInfoFile || join(dirname(tsConfigFile), "tsconfig.tsbuildinfo");
			if (!isAbsolute(buildInfoFile)) {
				buildInfoFile = resolve(dirname(tsConfigFile), buildInfoFile);
			}
			this.app.logger.value("   delete tsbuildinfo file", buildInfoFile, 3);
			try {
				await unlink(buildInfoFile);
			} catch {}
		}

		await this.execTsBuild2(relative(this.app.getRcPath("base"), tsConfigFile), 2, testsDir, true);
	}

}


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildTestSuitePlugin | undefined}
 */
const testsuite = (app) => undefined;
	// app.isTests && !app.isMain  && app.rc.plugins.testsuite ? new WpBuildTestSuitePlugin({ app }) : undefined;


module.exports = testsuite;

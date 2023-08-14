/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/tscheck.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { join } = require("path");
const dts = require("dts-bundle");
const { existsSync } = require("fs");
const { apply, WpBuildError } = require("../utils");
const WpBuildPlugin = require("./base");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("./base").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/issue/issue").Issue} ForkTsCheckerIssue */
/** @typedef {"write-tsbuildinfo" | "readonly" | "write-dts" | "write-references" | undefined} ForkTsCheckerMode */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/plugin-options").ForkTsCheckerWebpackPluginOptions} ForkTsCheckerOptions */


class WpBuildTsCheckPlugin extends WpBuildPlugin
{
    /**
     * @class WpBuildLicenseFilePlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
		const tsForkCheckerPlugins = WpBuildTsCheckPlugin.getTsForkCheckerPlugins(options.app);
        super(apply(options, { plugins: tsForkCheckerPlugins }), "tsCheck");
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		const tsForkCheckerHooks = ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler);
		tsForkCheckerHooks.error.tap(this.name, this.tsForkCheckerError.bind(this));
		tsForkCheckerHooks.start.tap(this.name, this.tsForkCheckerStart.bind(this));
		tsForkCheckerHooks.waiting.tap(this.name, this.tsForkCheckerWaiting.bind(this));
		tsForkCheckerHooks.issues.tap(this.name, this.tsForkCheckerIssues.bind(this));
		this.onApply(compiler,
		{
			bundleDtsFiles: {
				hook: "done",
				callback: this.bundle.bind(this)
			}
		});
	}


	/**
	 * @function
	 * @private
	 */
	bundle = () =>
	{
		if (!this.app.global.tsCheck.typesBundled && this.app.isMainTests && existsSync(join(this.app.getBuildPath(), "types", "dist")))
		{
			const bundleCfg = {
				name: `@spmeesseman/${this.app.rc.name}-types`,
				baseDir: "types/dist",
				headerPath: "",
				headerText: "",
				main: "types/index.d.ts",
				out: "types.d.ts",
				outputAsModuleFolder: true,
				verbose: this.app.rc.log.level === 5
			};
			dts.bundle(bundleCfg);
			this.app.global.tsCheck.typesBundled = true;
			this.app.logger.write("   dts bundle created successfully @ " + join(bundleCfg.baseDir, bundleCfg.out), 1);
		}
		else {
			this.app.logger.write("   dts bundle already written, skip", 1);
		}
	};


	/**
	 * @function
	 * @private
	 * @static
	 * @param {WpBuildApp} app
	 * @returns {WpBuildPluginVendorOptions[]}
	 * @throws {WpBuildError}
	 */
	static getTsForkCheckerPlugins = (app) =>
	{
		let tsConfig, tsConfigParams;
		const basePath = app.getBasePath(),
		      buildPath = app.getBuildPath();

		const _find = (base) =>
		{
			let tsCfg = join(base, `tsconfig.${app.build.name}.json`);
			if (!existsSync(tsCfg))
			{
				tsCfg = join(base, `tsconfig.${app.build.target}.json`);
				if (!existsSync(tsCfg))
				{
					tsCfg = join(base, `tsconfig.${app.build.mode}.json`);
					if (!existsSync(tsCfg))
					{
						tsCfg = join(base,`tsconfig.${app.build.type}.json`);
						if (!existsSync(tsCfg))
						{
							tsCfg = join(base, app.build.name, "tsconfig.json");
							if (!existsSync(tsCfg))
							{
								tsCfg = join(base,app.build.type, "tsconfig.json");
								if (!existsSync(tsCfg)) {
									tsCfg = join(base,"tsconfig.json");
								}
							}
						}
					}
				}
			}
			return tsCfg;
		};

		tsConfig = _find(app.getSrcPath());
		if (!existsSync(tsConfig)) {
			tsConfig = _find(basePath);
			if (!existsSync(tsConfig)) {
				tsConfig = _find(buildPath);
			}
		}

		if (app.build.type === "webapp" || app.build.target === "webworker")
		{
			if (!existsSync(tsConfig)) {
				tsConfig = join(buildPath, "tsconfig.webview.json");
			}
			tsConfigParams = [ tsConfig, "readonly" ];
		}
		else if (app.build.type === "tests")
		{
			if (!existsSync(tsConfig)) {
				tsConfig = join(buildPath, app.build.mode, "tsconfig.json");
				if (!existsSync(tsConfig)) {
					tsConfig = join(buildPath, app.build.mode, "tsconfig.json");
				}
			}
			tsConfigParams = [ tsConfig, "write-tsbuildinfo" ];
		}
		else if (app.build.type === "types")
		{
			tsConfigParams = [ tsConfig, "write-dts" ];
		}
		else
		{
			tsConfigParams = [ tsConfig, "write-dts" ];
		}

		if (!tsConfigParams[0] || !existsSync(tsConfigParams[0])) {
			throw WpBuildError.get(`Could not locate tsconfig file for '${app.mode}' environment`, "plugin/tscheck.js");
		}

		return [{
			ctor: ForkTsCheckerWebpackPlugin,
			options:
			{
				async: false,
				formatter: "basic",
				typescript: {
					build: !!tsConfigParams[2],
					mode: tsConfigParams[1],
					configFile: tsConfigParams[0]
				},
				// logger: {
				// 	error: app.logger.error,
				// 	/** @param {string} msg */
				// 	log: (msg) => app.logger.write("bold(tsforkchecker): " + msg)
				// }
			}
		}];
	};


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerError = () => this.logger.error("tsforkchecker error");


	/**
	 * @function
	 * @private
	 * @param {ForkTsCheckerIssue[]} issues
	 */
	tsForkCheckerIssues = (issues) =>
{
		this.logger.start("tsforkchecker filter issues");
		return issues.filter(i => i.severity === "error");
	};


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerStart = () => this.logger.start("tsforkchecker start");


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerWaiting = () => this.logger.start("tsforkchecker waiting for issues");

}


/**
 * Returns a `WpBuildTsCheckPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpconfigrc.json by setting the `plugins.tscheck`
 * property to a boolean value of  `true` or `false`
 * @function
 * @module
 * @param {WpBuildApp} app
 * @returns {(WpBuildTsCheckPlugin | ForkTsCheckerWebpackPlugin)[]}
 */
const tscheck = (app) => app.rc.plugins.tscheck ? new WpBuildTsCheckPlugin({ app }).getPlugins() : [];


module.exports = tscheck;

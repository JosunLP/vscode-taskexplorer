/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/tsforker.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { join } = require("path");
const dts = require("dts-bundle");
const { existsSync } = require("fs");
const WpBuildPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { apply, findTsConfig, WpBuildError } = require("../utils");
const ForkTsForkererWebpackPlugin = require("fork-ts-checker-webpack-plugin");



class WpBuildTsForkerPlugin extends WpBuildPlugin
{
    /**
     * @class WpBuildTsForkerPlugin
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
		const tsForkCheckerPlugins = WpBuildTsForkerPlugin.getTsForkCheckerPlugins(options.app);
        super(apply(options, { plugins: tsForkCheckerPlugins }), "tsForker");
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
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
		// const l = this.app.logger,
		// 	  typesDir = existsSync(this.app.getSrcTypesPath()),
		// 	  typesDirDist = existsSync(this.app.getRcPath("distTypes"));
		// l.write("dts bundling", 1);
		// l.value("   types directory", typesDir, 2);
		// l.value("   is main tests", this.app.isMainTests, 3);
		// l.value("   already bundled", this.app.global.tsForker.typesBundled,3);
		// if (!this.app.global.tsForker.typesBundled && this.app.isMainTests && typesDir && typesDirDist)
		// {
		// 	const bundleCfg = {
		// 		name: `${this.app.pkgJson.name}-types`,
		// 		baseDir: "types/dist",
		// 		headerPath: "",
		// 		headerText: "",
		// 		main: "types/index.d.ts",
		// 		out: "types.d.ts",
		// 		outputAsModuleFolder: true,
		// 		verbose: this.app.build.log.level === 5
		// 	};
		// 	dts.bundle(bundleCfg);
		// 	this.app.global.tsForker.typesBundled = true;
		// 	l.write("   dts bundle created successfully @ " + join(bundleCfg.baseDir, bundleCfg.out), 1);
		// }
		// else if (!typesDirDist) {
		// 	l.warning("   types output directory doesn't exist, dts bundling skipped");
		// }
		// else if (!typesDir) {
		// 	l.warning("   types directory doesn't exist, dts bundling skipped");
		// }
		// else {
		// 	l.write("   dts bundling skipped", 1);
		// }
	};


	/**
	 * @function
	 * @private
	 * @static
	 * @param {typedefs.WpBuildApp} app
	 * @returns {typedefs.WpBuildPluginVendorOptions[]}
	 * @throws {WpBuildError}
	 */
	static getTsForkCheckerPlugins = (app) =>
	{
		let tsConfigParams,
			tsConfig = findTsConfig(app.build);
		const buildPath = app.getRcPath("base");

		if (app.build.type === "webapp" || app.build.target === "webworker")
		{
			if (!tsConfig || !existsSync(tsConfig)) {
				tsConfig = join(buildPath, "tsconfig.webview.json");
			}
			tsConfigParams = [ tsConfig, "readonly" ];
		}
		else if (app.build.type === "tests")
		{
			if (!tsConfig || !existsSync(tsConfig)) {
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
			throw WpBuildError.get(`Could not locate tsconfig file for '${app.mode}' environment`, "plugin/tsforker.js");
		}

		app.logger.write(`add tsconfig file '${tsConfigParams[0]}' to tsforkchecker in ${tsConfigParams[1]} mode (build=${!!tsConfigParams[2]})`, 2);
		return [{
			ctor: ForkTsForkererWebpackPlugin,
			options:
			{
				async: false,
				formatter: "basic",
				typescript: {
					build: !!tsConfigParams[2],
					mode: tsConfigParams[1],
					configFile: tsConfigParams[0]
				}
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
	 * @param {import("fork-ts-checker-webpack-plugin/lib/issue/issue").Issue[]} issues
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
 * Returns a `WpBuildTsForkerPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpconfigrc.json by setting the `plugins.tsforker`
 * property to a boolean value of  `true` or `false`
 * @function
 * @module
 * @param {typedefs.WpBuildApp} app
 * @returns {(WpBuildTsForkerPlugin | ForkTsForkererWebpackPlugin)[]}
 */
const tsforker = (app) => []; // app.build.plugins.tsforker ? new WpBuildTsForkerPlugin({ app }).getPlugins() : [];


module.exports = tsforker;

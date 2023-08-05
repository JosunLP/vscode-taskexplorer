/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.tscheck
 */

const path = require("path");
const dts = require("dts-bundle");
const { existsSync } = require("fs");
const { findFiles, apply } = require("../utils");
const WpBuildBasePlugin = require("./base");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { join } = require("path");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/issue/issue").Issue} ForkTsCheckerIssue */
/** @typedef {"write-tsbuildinfo" | "readonly" | "write-dts" | "write-references" | undefined} ForkTsCheckerMode */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/plugin-options").ForkTsCheckerWebpackPluginOptions} ForkTsCheckerOptions */


class WpBuildTsCheckPlugin extends WpBuildBasePlugin
{

	/**
	 * @private
	 */
	logTagFc = "tsforkchecker plugin hook";


    /**
     * @class WpBuildLicenseFilePlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(apply(options, { plugins: WpBuildTsCheckPlugin.getTsForkCheckerPlugins(options.env) }));
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
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
			dtsBundle: {
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
		dts.bundle({
			name: "@spmeesseman/vscode-taskexplorer-types", // "index.d.ts",
			// name: "vscode-taskexplorer", // "index.d.ts",
			baseDir: "types/dist",
			main: "types/index.d.ts", //  join(this.env.paths.build, "types", "dist", "types", "index.d.ts"),
			out: "types.d.ts",
			verbose: false,
			outputAsModuleFolder: true
		});
	};


	/**
	 * @function
	 * @private
	 * @static
	 * @param {WpBuildEnvironment} env
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static getTsForkCheckerPlugins = (env) =>
	{
		const tsConfigs = /** @type {[ string, ForkTsCheckerMode, boolean? ][]} */([]);
		if (env.build === "webview")
		{
			tsConfigs.push(
				[ path.join(env.paths.base, "tsconfig.json"), "readonly" ]
			);
		}
		else if (env.build === "tests")
		{
			tsConfigs.push(
				[ path.join(env.paths.build, "tsconfig.test.json"), "write-tsbuildinfo" ],
				[ path.join(env.paths.build, "src", "test", "tsconfig.json"), "write-tsbuildinfo" ]
			);
		}
		else if (env.build === "types")
		{
			tsConfigs.push(
				[ path.join(env.paths.build, "tsconfig.types.json"), "write-dts" ],
				[ path.join(env.paths.build, "types", "tsconfig.json"), "write-dts" ]
			);
		}
		else
		{
			tsConfigs.push(
				// [ path.join(env.paths.build, "tsconfig.types.json"), "readonly" ],
				// [ path.join(env.paths.build, "types", "tsconfig.json"), "readonly" ],
				// [ path.join(env.paths.build, `tsconfig.${env.target}.json`), "readonly" ],
				// [ path.join(env.paths.build, env.build === "web" ? "tsconfig.web.json" : "tsconfig.json"), "readonly" ],
				[ path.join(env.paths.build, `tsconfig.${env.target}.json`), "write-dts" ],
				[ path.join(env.paths.build, env.build === "web" ? "tsconfig.web.json" : "tsconfig.json"), "write-dts" ]
			);
			// if (env.environment === "test")
			// {
			// 	tsConfigs.push(
			// 		[ path.join(env.paths.build, "tsconfig.test.json"), "write-tsbuildinfo", true ],
			// 		[ path.join(env.paths.build, "src", "test", "tsconfig.json"), "write-tsbuildinfo", true ]
			// 	);
			// }
		}

		return tsConfigs.filter(tsCfg => existsSync(tsCfg[0])).map((tsCfg) => (
		{
			ctor: ForkTsCheckerWebpackPlugin,
			options:
			{
				async: false,
				formatter: "basic",
				typescript: {
					build: !!tsCfg[2],
					mode: tsCfg[1],
					configFile: tsCfg[0]
				},
				logger: {
					error: env.logger.error,
					/** @param {string} msg */
					log: (msg) => env.logger.write("bold(tsforkchecker): " + msg)
				}
			}
		}));
	};


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerError = () => this.logHook(this.logTagFc, "error");


	/**
	 * @function
	 * @private
	 * @param {ForkTsCheckerIssue[]} issues
	 */
	tsForkCheckerIssues = (issues) =>
{
		this.logHook(this.logTagFc, "filter issues");
		return issues.filter(i => i.severity === "error");
	};


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerStart = () => this.logHook(this.logTagFc, "start");


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerWaiting = () => this.logHook(this.logTagFc, "waiting for issues");

}


/**
 * @param {WpBuildEnvironment} env
 * @returns {(WpBuildTsCheckPlugin | ForkTsCheckerWebpackPlugin | WebpackPluginInstance)[]}
 */
const tscheck = (env) => env.app.plugins.tscheck !== false ? new WpBuildTsCheckPlugin({ env }).getPlugins() : [];


module.exports = tscheck;

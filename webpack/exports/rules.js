/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file exports/rules.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const path = require("path");
const esbuild = require("esbuild");
const { existsSync } = require("fs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { getTsConfig, WpBuildApp, WpBuildError, uniq, merge } = require("../utils");


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 * @param {import("../types").WpBuildAppTsConfig} tsConfig
	 * @throws {WpBuildError}
	 */
	module: (app, tsConfig) =>
	{
		const srcPath = app.getSrcPath();
		tsConfig.include.push(srcPath);

		app.wpc.module.rules.push(
		{
			test: /\.ts$/,
			issuerLayer: "release",
			include: srcPath,
			// include(resourcePath, issuer) {
			// 	console.log(`  context: ${app.wpc.context} (from ${issuer})`);
			// 	console.log(`  resourcePath: ${resourcePath} (from ${issuer})`);
			// 	console.log(`  included: ${path.relative(app.wpc.context || ".", resourcePath)} (from ${issuer})`);
			// 	return true; // include all
			// },
			loader: "string-replace-loader",
			options: stripLoggingOptions(),
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/
			]
		},
		{
			test: /wrapper\.ts$/,
			issuerLayer: "release",
			include: path.join(srcPath, "lib"),
			loader: "string-replace-loader",
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/
			],
			options: {
				search: /^log\.(?:write2?|error|warn|info|values?|method[A-Z][a-z]+)\]/g,
				replace: "() => {}]"
			}
		},
		{
			test: /\.ts$/,
			include: tsConfig.include,
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/, /\.vscode/
			],
			use: app.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: [ "es2020", "chrome91", "node16.20" ],
					tsconfigRaw: tsConfig.json
				}
			} :
			{
				loader: "ts-loader",
				options: {
					configFile: tsConfig.path,
					// experimentalWatchApi: true,
					transpileOnly: true // !existsSync(typesPath) || tsConfig.json.compilerOptions.declarations !== true
				}
			}
		});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 * @param {import("../types").WpBuildAppTsConfig} tsConfig
	 * @param {boolean} [fromMain]
	 */
	tests: (app, tsConfig, fromMain) =>
	{
		if (app.build.type !== "tests" && app.isTests && app.buildEnvHasTests()) {
			return;
		}

		const srcPath = app.getSrcPath(),
			  buildPath = app.getRcPath("base");

		tsConfig.include.push(srcPath);

		app.wpc.module.rules.push(
		{
			test: /index\.js$/,
			include: path.join(buildPath, "node_modules", "nyc"),
			loader: "string-replace-loader",
			options: {
				search: "selfCoverageHelper = require('../self-coverage-helper')",
				replace: "selfCoverageHelper = { onExit () {} }"
			}
		},
		{
			test: /\.ts$/,
			include: tsConfig.include,
			exclude: [
				/node_modules/, /types[\\/]/, /\.d\.ts$/
			],
			use: {
				loader: "babel-loader",
				options: {
					presets: [
						[ "@babel/preset-env", { targets: "defaults" }],
						[ "@babel/preset-typescript" ]
					]
				}
			}
		});

		if (!fromMain)
		{
			app.wpc.module.rules.splice(1, 0,
			{
				test: /\.ts$/,
				include: srcPath + (fromMain ? "\\test" : ""),
				exclude: [
					/node_modules/, /test[\\/]/, /\.d\.ts$/
				],
				use: {
					loader: "ts-loader",
					options: {
						configFile: tsConfig.path,
						experimentalWatchApi: false,
						transpileOnly: false,
						logInfoToStdOut: app.rc.log.level && app.rc.log.level >= 0,
						logLevel: app.rc.log.level && app.rc.log.level >= 3 ? "info" : (app.rc.log.level && app.rc.log.level >= 1 ? "warn" : "error"),
						compilerOptions: {
							emitDeclarationsOnly: true
						}
					}
				}
			});
		}
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @param {import("../types").WpBuildAppTsConfig} tsConfig
	 * @throws {WpBuildError}
	 */
	types: (app, tsConfig) =>
	{
		const typesDir = app.getSrcTypesPath();
		if (existsSync(typesDir))
		{
			tsConfig.include.push(typesDir);

			app.wpc.module.rules.push(
			{
				test: /\.ts$/,
				include: app.getSrcPath(),
				exclude: [
					/node_modules/, /test[\\/]/, /\.d\.ts$/
				],
				use: app.esbuild ?
				{
					loader: "esbuild-loader",
					options: {
						implementation: esbuild,
						loader: "tsx",
						target: [ "es2020", "chrome91", "node16.20" ],
						tsconfigRaw: tsConfig.json
					}
				} :
				{
					loader: "ts-loader",
					options: {
						// configFile: path.join(app.paths.build, "types", "tsconfig.json"),
						configFile: tsConfig.path,
						experimentalWatchApi: false,
						transpileOnly: false,
						logInfoToStdOut: app.rc.log.level && app.rc.log.level >= 0,
						logLevel: app.rc.log.level && app.rc.log.level >= 3 ? "info" : (app.rc.log.level && app.rc.log.level >= 1 ? "warn" : "error"),
						compilerOptions: {
							emitDeclarationsOnly: true
						}
					}
				}
			});
		}
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @param {{ raw: string; json: Record<string, any>; include: string[]; path: string }} tsConfig
	 * @throws {WpBuildError}
	 */
	webapp: (app, tsConfig) =>
	{
		const srcPath = app.getSrcPath();
		tsConfig.include.push(srcPath);

		app.wpc.module.rules.push(...[
		{
			test: /\.m?js/,
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/, /\.vscode/
			],
			resolve: { fullySpecified: false }
		},
		{
			include: uniq(tsConfig.include),
			test: /\.tsx?$/,
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/, /\.vscode/
			],
			use: [ app.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: "es2020",
					tsconfigRaw: tsConfig.json
				}
			} : {
				loader: "ts-loader",
				options: {
					configFile: tsConfig.path,
					// experimentalWatchApi: true,
					transpileOnly: true
				}
			} ]
		},
		{
			test: /\.s?css$/,
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/, /\.vscode/
			],
			use: [
			{
				loader: MiniCssExtractPlugin.loader
			},
			{
				loader: "css-loader",
				options: {
					sourceMap: app.wpc.mode !== "production",
					url: false
				}
			},
			{
				loader: "sass-loader",
				options: {
					sourceMap: app.wpc.mode !== "production"
				}
			}]
		}]);

		const typesDir = app.getSrcTypesPath();
		if (typesDir && app.rc.args.name && !app.rc.builds.find(b => b.type === "module")) //  && !existsSync(typesDir))
		{
			// app.wpc.module.rules.unshift(
			// {
			// 	test: /\.ts$/,
			// 	include: srcPath,
			// 	exclude: [
			// 		/node_modules/, /test[\\/]/, /\.d\.ts$/
			// 	],
			// 	use: {
			// 		loader: "ts-loader",
			// 		options: {
			// 			configFile: tsConfig.path,
			// 			experimentalWatchApi: false,
			// 			transpileOnly: false,
			// 			logInfoToStdOut: app.rc.log.level && app.rc.log.level >= 0,
			// 			logLevel: app.rc.log.level && app.rc.log.level >= 3 ? "info" : (app.rc.log.level && app.rc.log.level >= 1 ? "warn" : "error"),
			// 			compilerOptions: {
			// 				emitDeclarationsOnly: true
			// 			}
			// 		}
			// 	}
			// });
		}
	}

};


/**
 * @function
 * @private
 */
const stripLoggingOptions = () => ({
	multiple: [
	{
		search: /=>\s*(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\s*\([^]*?\)\s*\}\);/g,
		replace: (/** @type {string} */r) => {
			return "=> {}\r\n" + r.substring(r.slice(0, r.length - 3).lastIndexOf(")") + 1);
		}
	},
	{
		search: /=>\s*(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2|info|values?|method[A-Z][a-z]+)\s*\([^]*?\),/g,
		replace: "=> {},"
	},
	{
		search: /=>\s*(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\s*\([^]*?\) *;/g,
		replace: "=> {};"
	},
	{
		search: /(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\s*\([^]*?\)\s*;\s*?(?:\r\n|$)/g,
		replace: "\r\n"
	},
	{
		search: /this\.wrapper\.log\.(?:write2?|info|values?|method[A-Z][a-z]+),/g,
		replace: "this.wrapper.emptyFn,"
	},
	{
		search: /wrapper\.log\.(?:write2?|info|values?|method[A-Z][a-z]+),/g,
		replace: "wrapper.emptyFn,"
	},
	{
		search: /w\.log\.(?:write2?|info|values?|method[A-Z][a-z]+),/g,
		replace: "w.emptyFn,"
	},
	{
		search: /this\.wrapper\.log\.(?:write2?|info|values?|method[A-Z][a-z]+)\]/g,
		replace: "this.wrapper.emptyFn]"
	},
	{
		search: /wrapper\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\]/g,
		replace: "wrapper.emptyFn]"
	},
	{
		search: /w\.log\.(?:write2?|info|values?|method[A-Z][a-z]+)\]/g,
		replace: "w.emptyFn]"
	}]
});


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 * @throws {WpBuildError}
 */
const rules = (app) =>
{
	const tsConfig = merge({}, app.tsConfig);

	if (!tsConfig && app.source === "typescript") {
		throw WpBuildError.getErrorMissing("tsconfig file", "exports/rules.js", app.wpc);
	}

	if (tsConfig) {
		app.logger.write("wp configuration rules found tsconfig file", 2);
		app.logger.value("   tsConfig.path", tsConfig.path, 2);
	}

	app.wpc.module = { rules: [] };
	if (builds[app.build.type])
	{
		builds[app.build.type](app, tsConfig);
		builds.tests(app, tsConfig, true);
	}
	else if (builds[app.build.name])
	{
		builds[app.build.name](app, tsConfig);
		builds.tests(app, tsConfig, true);
	}
	else {
		throw WpBuildError.getErrorProperty("rules", "exports/rules.js", app.wpc);
	}
};


module.exports = rules;

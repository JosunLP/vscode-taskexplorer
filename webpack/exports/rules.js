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
const typedefs = require("../types/typedefs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WpBuildApp, WpBuildError, uniq, merge, isObject, isArray, apply } = require("../utils");
const { isAbsolute, resolve } = require("path");


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @param {typedefs.WpBuildAppTsConfig} tsConfig
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
			use: getTsSourceLoader(app, tsConfig),
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/, /\.vscode/
			]
		});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
	 * @param {typedefs.WpBuildAppTsConfig} tsConfig Cloned copy of app.tsConfig info object
	 */
	tests: (app, tsConfig) =>
	{
		if (app.build.type !== "tests" && app.isTests && app.hasTests()) {
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
			include: getTsIncludesAbs(app, tsConfig),
			use: getTsSourceLoader(app, tsConfig, "babel"),
			exclude: [
				/node_modules/, /types[\\/]/, /\.d\.ts$/
			]
		});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @param {typedefs.WpBuildAppTsConfig} tsConfig Cloned copy of app.tsConfig info object
	 * @throws {WpBuildError}
	 */
	types: (app, tsConfig) =>
	{
		const typesDir = app.getSrcPath({ build: app.build.name }),
			  typesDirDist = app.getDistPath({ build: app.build.name });
		if (typesDir && existsSync(typesDir))
		{
			// tsConfig.include.push(typesDir);
			const loader = getTsSourceLoader(app, tsConfig);
			if (loader.loader === "ts-loader")
			{
				apply(loader.options,
				{
					transpileOnly: false,
					compilerOptions: {
						declaration: true,
						declarationDir: typesDirDist,
						emitDeclarationsOnly: true
					}
				});
			}
			app.wpc.module.rules.push(
			{
				use: loader,
				test: /\.ts$/,
				include: app.getSrcPath(),
				exclude: [
					/node_modules/, /test[\\/]/
				]
			});
		}
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @param {typedefs.WpBuildAppTsConfig} tsConfig Cloned copy of app.tsConfig info object
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
			use: getTsSourceLoader(app, tsConfig),
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/, /\.vscode/
			]
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

		const typesDir = app.getSrcPath({ build: app.build.name });
		if (typesDir && app.args.name && !app.rc.builds.find(b => b.type === "module")) //  && !existsSync(typesDir))
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
			// 			logInfoToStdOut: app.build.log.level && app.build.log.level >= 0,
			// 			logLevel: app.build.log.level && app.build.log.level >= 3 ? "info" : (app.build.log.level && app.build.log.level >= 1 ? "warn" : "error"),
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
 * @param {WpBuildApp} app
 * @param {typedefs.WpBuildAppTsConfig} tsConfig
 * @returns {string[]}
 */
const getTsIncludesAbs = (app, tsConfig) =>
{
	return tsConfig.include.map(path => isAbsolute(path) ? path : resolve(app.getRcPath("base"), path));
};


/**
 * @param {WpBuildApp} app
 * @param {typedefs.WpBuildAppTsConfig} tsConfig
 * @param {string} [loader]
 * @returns {typedefs.WebpackRuleSetUseItem}
 */
const getTsSourceLoader = (app, tsConfig, loader) =>
{
	if (app.args.esbuild || loader === "esbuild") {
		return buildOptions.esbuild(app, tsConfig);
	}
	if (app.args.babel || loader === "babel") {
		return buildOptions.babel(app, tsConfig);
	}
	return buildOptions.ts(app, tsConfig);
};


const buildOptions =
{
	/**
	 * @param {WpBuildApp} app
	 * @param {typedefs.WpBuildAppTsConfig} tsConfig
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	babel: (app, tsConfig) =>
	{
		return {
			loader: "babel-loader",
			options: {
				presets: [
					[ "@babel/preset-env", { targets: "defaults" }],
					[ "@babel/preset-typescript" ]
				]
			}
		};
	},

	/**
	 * @param {WpBuildApp} app
	 * @param {typedefs.WpBuildAppTsConfig} tsConfig
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	esbuild: (app, tsConfig) =>
	{
		return {
			loader: "esbuild",
			options: {
				implementation: esbuild,
				loader: "tsx",
				target: "es2020",
				tsconfigRaw: tsConfig.json
			}
		};
	},

	/**
	 * @param {WpBuildApp} app
	 * @param {typedefs.WpBuildAppTsConfig} tsConfig
	 * @returns {typedefs.WebpackRuleSetUseItem}
	 */
	ts: (app, tsConfig) =>
	{
		return {
			loader: "ts-loader",
			options: {
				configFile: tsConfig.path,
				experimentalWatchApi: false,
				logInfoToStdOut: app.build.log.level && app.build.log.level >= 0,
				logLevel: app.build.log.level && app.build.log.level >= 3 ? "info" : (app.build.log.level && app.build.log.level >= 1 ? "warn" : "error"),
				transpileOnly: true
			}
		};
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
 * @see {@link https://webpack.js.org/configuration/rules webpack.js.org/rules}
 *
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
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

	if (!isObject(app.wpc.module))
	{
		app.wpc.module = { rules: [] };
	}
	else if (!isArray(app.wpc.module.rules))
	{
		app.wpc.module.rules = [];
	}

	if (builds[app.build.type || app.build.name])
	{
		builds[app.build.type || app.build.name](app, tsConfig);
	}
	else {
		throw WpBuildError.getErrorProperty("rules", "exports/rules.js", app.wpc);
	}
};


module.exports = rules;

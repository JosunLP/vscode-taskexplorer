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
const { getTsConfig, WpBuildApp } = require("../utils");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


const builds =
{
	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 */
	module: (app) =>
	{
		const srcPath = app.getSrcPath(),
			  buildPath = app.getBuildPath();
		if (app.isTests && !app.rc.builds.find(b => b.type === "tests")) {
			builds.tests(app);
		}
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
			include: srcPath,
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/
			],
			use: app.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: [ "es2020", "chrome91", "node16.20" ],
					tsconfigRaw: getTsConfig(buildPath, `tsconfig.${app.target}.json`)
				}
			} :
			{
				loader: "ts-loader",
				options: {
					configFile: path.join(buildPath, `tsconfig.${app.target}.json`),
					// experimentalWatchApi: true,
					transpileOnly: true
				}
			}
		});
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 * @param {boolean} [fromMain]
	 */
	tests: (app, fromMain) =>
	{
		const srcPath = app.getSrcPath(),
			  buildPath = app.getBuildPath();
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
		// {
		// 	test: /\.ts$/,
		// 	include: resolve(srcPath, (fromMain ? "." : "..")),
		// 	exclude: [
		// 		/node_modules/, /test[\\/]/, /\.d\.ts$/
		// 	],
		// 	use: {
		// 		loader: "ts-loader",
		// 		options: {
		// 			configFile: path.join(buildPath, `tsconfig.${app.target}.json`),
		// 			experimentalWatchApi: false,
		// 			transpileOnly: false,
		// 			logInfoToStdOut: app.rc.log.level && app.rc.log.level >= 0,
		// 			logLevel: app.rc.log.level && app.rc.log.level >= 3 ? "info" : (app.rc.log.level && app.rc.log.level >= 1 ? "warn" : "error"),
		// 			compilerOptions: {
		// 				emitDeclarationsOnly: true
		// 			}
		// 		}
		// 	}
		// },
		{
			test: /\.ts$/,
			include: srcPath + (fromMain ? "\\test" : ""),
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
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 */
	types: (app) =>
	{
		const buildPath = app.getBuildPath();
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
					tsconfigRaw: getTsConfig(
						buildPath, path.join(buildPath, "types", "tsconfig.json"),
					)
				}
			} :
			{
				loader: "ts-loader",
				options: {
					// configFile: path.join(app.paths.build, "types", "tsconfig.json"),
					configFile: path.join(buildPath, `tsconfig.${app.target}.json`),
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
	},


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app Webpack build environment
	 */
	webapp: (app) =>
	{
		const basePath = app.getBasePath(),
			  srcPath = app.getSrcPath();
		app.wpc.module.rules.push(...[
		{
			test: /\.m?js/,
			resolve: { fullySpecified: false },
		},
		{
			exclude: /\.d\.ts$/,
			include: srcPath,
			test: /\.tsx?$/,
			use: [ app.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: "es2020",
					tsconfigRaw: getTsConfig(basePath, "tsconfig.json"),
				},
			} : {
				loader: "ts-loader",
				options: {
					configFile: path.join(basePath, "tsconfig.json"),
					// experimentalWatchApi: true,
					transpileOnly: true,
				},
			} ]
		},
		{
			test: /\.s?css$/,
			exclude: /node_modules/,
			use: [
			{
				loader: MiniCssExtractPlugin.loader,
			},
			{
				loader: "css-loader",
				options: {
					sourceMap: app.wpc.mode !== "production",
					url: false,
				},
			},
			{
				loader: "sass-loader",
				options: {
					sourceMap: app.wpc.mode !== "production",
				},
			}]
		}]);
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
 */
const rules = (app) =>
{
	app.wpc.module = { rules: [] };
	builds[app.build.type](app);
};


module.exports = rules;

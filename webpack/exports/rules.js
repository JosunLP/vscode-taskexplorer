/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.exports.rules
 */

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */

const path = require("path");
const JSON5 = require("json5");
const esbuild = require("esbuild");
const { spawnSync } = require("child_process");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const rules = (env, wpConfig) =>
{
	wpConfig.module = {};
	wpConfig.module.rules = [];

	if (env.build === "webview")
	{
		wpConfig.module.rules.push(...[
		{
			test: /\.m?js/,
			resolve: { fullySpecified: false },
		},
		{
			exclude: /\.d\.ts$/,
			include: path.join(env.buildPath, "src"),
			test: /\.tsx?$/,
			use: [ env.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: "es2020",
					tsconfigRaw: getTsConfig(env, path.join(env.basePath, "tsconfig.json")),
				},
			} : {
				loader: "ts-loader",
				options: {
					configFile: path.join(env.basePath, "tsconfig.json"),
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
					sourceMap: wpConfig.mode !== "production",
					url: false,
				},
			},
			{
				loader: "sass-loader",
				options: {
					sourceMap: wpConfig.mode !== "production",
				},
			}]
		}]);
	}
	else if (env.build === "tests")
	{
		const testsRoot = path.join(env.buildPath, "src", "test");
		wpConfig.module.rules.push(...[
		{   //
			// The author of this package decided to import a 700k library (Moment) (un-compressed)
			// for the use of one single function call.
			// Dynamically replace this garbage, it decreases our vendor package from 789K (compressed)
			// to just over 380k (compressed).  Over half.  Smh.
			//
			test: /index\.js$/,
			include: path.join(env.buildPath, "node_modules", "nyc"),
			loader: "string-replace-loader",
			options: {
				multiple: [
				{
					search: "selfCoverageHelper = require('../self-coverage-helper')",
					replace: "selfCoverageHelper = { onExit () {} }"
				},
				{
					search: "return moment",
					replace: "return new Date"
				}]
			}
		},
		{
			test: /\.ts$/,
			include: testsRoot,
			exclude: [
				/node_modules/, /types[\\/]/, /\.d\.ts$/
			],
			use: {
				loader: "babel-loader",
				options: {
					presets: [
						[ "@babel/preset-env", { targets: "defaults" }],
						[ "@babel/preset-typescript" ],
					]
				}
			}
		}]);
	}
	else
	{
		wpConfig.module.rules.push(...[
		// {   //
		// 	// THe author of this package decided to import a 700k library (Moment) (un-compressed)
		// 	// for the use of one single function call.
		// 	// Dynamically replace this garbage, it decreases our vendor package from 789K (compressed)
		// 	// to just over 380k (compressed).  Over half.  Smh.
		// 	//
		// 	test: /tools\.js$/,
		// 	include: path.join(env.buildPath, "node_modules", "@sgarciac", "bombadil", "lib"),
		// 	loader: "string-replace-loader",
		// 	options: {
		// 	  	multiple: [
		// 		{
		// 			search: 'var moment = require(\"moment\");',
		// 			replace: ""
		// 		},
		// 		{
		// 			search: "return moment",
		// 			replace: "return new Date"
		// 		}]
		// 	}
		// },
		// {
		// 	test: /\.js$/,
		// 	enforce: /** @type {"pre"|"post"} */("pre"),
		// 	exclude: [
		// 		/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/
		// 	],
		// 	use: [
		// 	{
		// 		loader: "source-map-loader",
		// 		options:
		// 		{
		// 			filterSourceMappingUrl: (url, resourcePath) => {
		// 				if (/crypto$/i.test(url)) {
		// 					return false;
		// 				}
		// 				if (/events/.test(resourcePath)) {
		// 					return "skip";
		// 				}
		// 				return true;
		// 			}
		// 		}
		// 	}]
		// },
		{
			test: /\.ts$/,
			include: path.join(env.buildPath, "src"),
			exclude: [
				/node_modules/, /test[\\/]/, /types[\\/]/, /\.d\.ts$/
			],
			use: [ env.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: [ "es2020", "chrome91", "node16.20" ],
					tsconfigRaw: getTsConfig(
						env, path.join(env.buildPath, env.build === "browser" ? "tsconfig.browser.json" : "tsconfig.json"),
					)
				}
			} :
			{
				loader: "ts-loader",
				options: {
					configFile: path.join(env.buildPath, env.build === "browser" ? "tsconfig.browser.json" : "tsconfig.json"),
					// experimentalWatchApi: true,
					transpileOnly: true
				}
			} ]
		}]);
	}
};


/**
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {String} tsConfigFile
 * @returns {String}
 */
const getTsConfig = (env, tsConfigFile) =>
{
	const result = spawnSync("npx", [ "tsc", `-p ${tsConfigFile}`, "--showConfig" ], {
		cwd: env.buildPath,
		encoding: "utf8",
		shell: true,
	});
	const data = result.stdout,
		  start = data.indexOf("{"),
		  end = data.lastIndexOf("}") + 1;
	return JSON5.parse(data.substring(start, end));
};


module.exports = rules;

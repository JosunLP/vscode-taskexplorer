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
		{
			test: /index\.js$/,
			include: path.join(env.buildPath, "node_modules", "nyc"),
			loader: "string-replace-loader",
			options: {
				search: "selfCoverageHelper = require('../self-coverage-helper')",
				replace: "selfCoverageHelper = { onExit () {} }"
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
	else // extension - node or browser
	{
		const configFile = env.build === "browser" ? "tsconfig.browser.json" : "tsconfig.json";

		if (env.stripLogging)
		{
			wpConfig.module.rules.push(...[{
				test: /\.ts$/,
				include: path.join(env.buildPath, "src"),
				loader: "string-replace-loader",
				options: {
					multiple: [
					{
						search: /=>\s*(?:this\.wrapper|this|wrapper|w)\._?log\.(?:write2?|info|values?|method[A-Z][a-z]+)\s*\([^]*?\)\s*\}\);/g,
						replace: (/** @type {String} */r) => {
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
				}
			},
			{
				test: /wrapper\.ts$/,
				include: path.join(env.buildPath, "src", "lib"),
				loader: "string-replace-loader",
				options: {
					search: /^log\.(?:write2?|error|warn|info|values?|method[A-Z][a-z]+)\]/g,
					replace: "() => {}]"
				}
			}]);
		}

		wpConfig.module.rules.push({
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
						env, path.join(env.buildPath, configFile),
					)
				}
			} :
			{
				loader: "ts-loader",
				options: {
					configFile: path.join(env.buildPath, configFile),
					// experimentalWatchApi: true,
					transpileOnly: true
				}
			} ]
		});
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

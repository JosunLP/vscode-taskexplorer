/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const { renameSync } = require("fs");
const { spawnSync } = require("child_process");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const CspHtmlPlugin = require("csp-html-webpack-plugin");
const VisualizerPlugin = require("webpack-visualizer-plugin2");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// const TerserPlugin = require("terser-webpack-plugin");
// const ShebangPlugin = require("webpack-shebang-plugin");
// const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// const FilterWarningsPlugin = require("webpack-filter-warnings-plugin");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */

const colors = {
	white: [ 37, 39 ],
	grey: [ 90, 39 ],
	blue: [ 34, 39 ],
	cyan: [ 36, 39 ],
	green: [ 32, 39 ],
	magenta: [ 35, 39 ],
	red: [ 31, 39 ],
	yellow: [ 33, 39 ]
};

/**
 * @param {String} msg
 * @param {Number[]} color Webpack config object
 */
const withColor = (msg, color) => "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m";


const wpPlugin =
{
	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {WebpackPluginInstance | undefined}
	 */
	afterdone: (env, wpConfig) =>
	{
		// "AfterDonePlugin" MUST BE LAST IN THE PLUGINS ARRAY!!
		/** @type {WebpackPluginInstance | undefined} */
		let plugin;
		if (env.build !== "webview")
		{
			const _env = { ...env },
				  _wpConfig = { ...wpConfig };
			plugin =
			{   /** @param {import("webpack").Compiler} compiler Compiler */
				apply: (compiler) =>
				{
					compiler.hooks.done.tap("AfterDonePlugin", () =>
					{
						if (_wpConfig.mode === "production")
						{
							try {
								renameSync(path.join(env.buildPath, "dist", "vendor.js.LICENSE.txt"), path.join(env.buildPath, "dist", "vendor.LICENSE"));
								renameSync(path.join(env.buildPath, "dist", "taskexplorer.js.LICENSE.txt"), path.join(env.buildPath, "dist", "taskexplorer.LICENSE"));
							} catch {}
						}
						else if (_env.build === "extension" && _env.environment === "test")
						{
							const outFile = path.join(env.buildPath, "dist", "taskexplorer.js");
							if (fs.existsSync(outFile))
							{
								const regex = /\n[ \t]*module\.exports \= require\(/mg,
										content = fs.readFileSync(outFile, "utf8").replace(regex, (v) => "/* istanbul ignore next */" + v);
								fs.writeFileSync(outFile, content);
							}
						}
					});
				}
			};
		}
		return plugin;
	},


	analyze:
	{
		/**
		 * @param {WebpackEnvironment} env
		 * @param {WebpackConfig} wpConfig Webpack config object
		 * @returns {BundleAnalyzerPlugin | undefined}
		 */
		bundle: (env, wpConfig) =>
		{
			let plugin;
			if (env.analyze === true)
			{
				plugin = new BundleAnalyzerPlugin({
					analyzerPort: "auto",
					analyzerMode: "static",
					generateStatsFile: true,
					statsFilename: "../.coverage/analyzer-stats.json",
					reportFilename: "../.coverage/analyzer.html",
					openAnalyzer: true
				});
			}
			return plugin;
		},

		/**
		 * @param {WebpackEnvironment} env
		 * @param {WebpackConfig} wpConfig Webpack config object
		 * @returns {CircularDependencyPlugin | undefined}
		 */
		circular: (env, wpConfig) =>
		{
			let plugin;
			if (env.analyze === true)
			{
				plugin = new CircularDependencyPlugin(
				{
					cwd: env.buildPath,
					exclude: /node_modules/,
					failOnError: false,
					onDetected: ({ module: _webpackModuleRecord, paths, compilation }) =>
					{
						compilation.warnings.push(/** @type {*}*/(new webpack.WebpackError(paths.join(" -> "))));
					}
				});
			}
			return plugin;
		},

		/**
		 * @param {WebpackEnvironment} env
		 * @param {WebpackConfig} wpConfig Webpack config object
		 * @returns {VisualizerPlugin | undefined}
		 */
		visualizer: (env, wpConfig) =>
		{
			let plugin;
			if (env.analyze === true) {
				plugin = new VisualizerPlugin({ filename: "../.coverage/visualizer.html" });
			}
			return /** @type {VisualizerPlugin | undefined}) */(plugin);
		}
	},


	// babel:
	// {
	// 	/**
	// 	 * @param {WebpackEnvironment} env
	// 	 * @returns {void}
	// 	 */
	// 	buildTests: (env) =>
	// 	{
	// 		// let babel = [
	// 		// 	"babel", "./src/test/suite", "--out-dir", "./dist/test/suite", "--extensions", ".ts",
	// 		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
	// 		// ];
	// 		// spawnSync("npx", babel, { cwd: env.buildPath, encoding: "utf8", shell: true });
	// 		// babel = [
	// 		// 	"babel", "./src/test/run", "--out-dir", "./dist/test/run", "--extensions", ".ts",
	// 		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
	// 		// ];
	// 		// spawnSync("npx", babel, { cwd: env.buildPath, encoding: "utf8", shell: true });
	// 		const babel = [
	// 			"babel", "./src/test", "--out-dir", "./dist/test", "--extensions", ".ts",
	// 			"--presets=@babel/preset-env,@babel/preset-typescript",
	// 		];
	// 		spawnSync("npx", babel, { cwd: env.buildPath, encoding: "utf8", shell: true });
	// 	}
	// },


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {webpack.BannerPlugin | undefined}
	 */
	banner: (env, wpConfig) =>
	{
		let plugin;
		if (wpConfig.mode === "production")
		{
			plugin = new webpack.BannerPlugin(
			{
				banner: `Copyright ${(new Date()).getFullYear()} Scott P Meesseman`,
				entryOnly: true,
				test: /taskexplorer\.js/
				// raw: true
			});
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {WebpackPluginInstance | undefined}
	 */
	beforecompile: (env, wpConfig) =>
	{
		const isTestsBuild = (env.build === "tests" || env.environment.startsWith("test"));
		let plugin;
		if (env.build !== "webview")
		{
			const _env = { ...env };
			plugin =
			{   /** @param {import("webpack").Compiler} compiler Compiler */
				apply: (compiler) =>
				{
					compiler.hooks.beforeCompile.tap("BeforeCompilePlugin", () =>
					{
						try {
							wpPlugin.tsc.buildTypes(_env);
							if (isTestsBuild) {
								wpPlugin.tsc.buildTests(_env);
							}
						} catch {}
					});
				}
			};
		}
		return plugin;
	},


	/**
	 * @param {String[]} apps
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {CopyPlugin | undefined}
	 */
	copy: (apps, env, wpConfig) =>
	{
		let plugin;
		const /** @type {CopyPlugin.Pattern[]} */patterns = [],
			  psx__dirname = env.buildPath.replace(/\\/g, "/"),
			  psxBasePath = env.basePath.replace(/\\/g, "/"),
			  psxBaseCtxPath = path.posix.join(psxBasePath, "res");
		if (env.build === "webview")
		{
			apps.filter(app => fs.existsSync(path.join(env.basePath, app, "res"))).forEach(
				app => patterns.push(
				{
					from: path.posix.join(psxBasePath, app, "res", "*.*"),
					to: path.posix.join(psx__dirname, "res", "webview"),
					context: path.posix.join(psxBasePath, app, "res")
				})
			);
			if (fs.existsSync(path.join(env.basePath, "res")))
			{
				patterns.push({
					from: path.posix.join(psxBasePath, "res", "*.*"),
					to: path.posix.join(psx__dirname, "res", "webview"),
					context: psxBaseCtxPath
				});
			}
		}
		else if ((env.build === "extension" || env.build === "browser") && wpConfig.mode === "production")
		{
			const psx__dirname_info = path.posix.normalize(path.posix.join(psx__dirname, "..", "vscode-taskexplorer-info"));
			patterns.push(
			{
				from: path.posix.join(psxBasePath, "res", "img", "**"),
				to: path.posix.join(psx__dirname_info, "res"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "res", "readme", "*.png"),
				to: path.posix.join(psx__dirname_info, "res"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "doc", ".todo"),
				to: path.posix.join(psx__dirname_info, "doc"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "res", "walkthrough", "welcome", "*.md"),
				to: path.posix.join(psx__dirname_info, "doc"),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "*.md"),
				to: path.posix.join(psx__dirname_info),
				context: psxBaseCtxPath
			},
			{
				from: path.posix.join(psxBasePath, "LICENSE*"),
				to: path.posix.join(psx__dirname_info),
				context: psxBaseCtxPath
			});
		}
		if (patterns.length > 0) {
			plugin = new CopyPlugin({ patterns });
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {MiniCssExtractPlugin}
	 */
	cssextract: (env, wpConfig) =>
	{
		return new MiniCssExtractPlugin(
		{
			filename: (pathData, assetInfo) =>
			{
				let name = "[name]";
				if (pathData.chunk?.name) {
					name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
				}
				return `css/${name}.css`;
			}
		});
	},


	figures:
	{
		colors,
		error: "✘",
		info: "ℹ",
		success: "✔",
		warning: "⚠",
		withColor,
		color:
		{
			success: withColor("✔", colors.green),
			successBlue: withColor("✔", colors.blue),
			info: withColor("ℹ", colors.magenta),
			infoTask: withColor("ℹ", colors.blue),
			warning: withColor("⚠", colors.yellow),
			warningTests: withColor("⚠", colors.blue),
			error: withColor("✘", colors.red),
			errorTests: withColor("✘", colors.blue)
		}
	},


	/**
	 * @param { string } name
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {HtmlPlugin}
	 */
	html: (name, env, wpConfig) =>
	{
		const wwwName = name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
		return new HtmlPlugin(
		{
			chunks: [ name, wwwName ],
			filename: path.posix.join(env.buildPath, "res", "page", `${wwwName}.html`),
			inject: true,
			inlineSource: wpConfig.mode === "production" ? ".css$" : undefined,
			// inlineSource: undefined,
			scriptLoading: "module",
			template: path.posix.join(name, `${wwwName}.html`),
			minify: wpConfig.mode !== "production" ? false :
			{
				removeComments: true,
				collapseWhitespace: true,
				removeRedundantAttributes: false,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeStyleLinkTypeAttributes: true,
				keepClosingSlash: true,
				minifyCSS: true,
			}
		});
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {CspHtmlPlugin}
	 */
	htmlcsp: (env, wpConfig) =>
	{
		const plugin = new CspHtmlPlugin(
		{
			// "connect-src":
			// wpConfig.mode !== 'production'
			// 		 ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.sandbox.paypal.com", "https://www.paypal.com" ]
			// 		 : [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.paypal.com" ],
			"default-src": "'none'",
			"font-src": [ "#{cspSource}" ],
			// "frame-src":
			// wpConfig.mode !== 'production'
			// 		 ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.sandbox.paypal.com", "https://www.paypal.com" ]
			// 		 : [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.paypal.com" ],
			"img-src": [ "#{cspSource}", "https:", "data:" ],
			"script-src":
			wpConfig.mode !== "production"
					? [ "#{cspSource}", "'nonce-#{cspNonce}'", "'unsafe-eval'" ]
					: [ "#{cspSource}", "'nonce-#{cspNonce}'" ],
			"style-src":
			wpConfig.mode === "production"
					? [ "#{cspSource}", "'nonce-#{cspNonce}'", "'unsafe-hashes'" ]
					: [ "#{cspSource}", "'unsafe-hashes'", "'unsafe-inline'" ]
		},
		{
			enabled: true,
			hashingMethod: "sha256",
			hashEnabled: {
				"script-src": true,
				"style-src": wpConfig.mode === "production",
			},
			nonceEnabled: {
				"script-src": true,
				"style-src": wpConfig.mode === "production",
			}
		});
		//
		// Override the nonce creation so it can be dynamically generated at runtime
		// @ts-ignore
		plugin.createNonce = () => "#{cspNonce}";
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {InlineChunkHtmlPlugin | undefined}
	 */
	htmlinlinechunks: (env, wpConfig) =>
	{
		let plugin;
		if (env.build === "webview")
		{
			// plugin = new InlineChunkHtmlPlugin(HtmlPlugin, wpConfig.mode === "production" ? ["\\.css$"] : []);
			plugin = new InlineChunkHtmlPlugin(HtmlPlugin, []);
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {ImageMinimizerPlugin | undefined}
	 */
	imageminimizer: (env, wpConfig) =>
	{
		let plugin;
		if (env.build === "webview" && wpConfig.mode !== "production")
		{
			// plugin = new ImageMinimizerPlugin({
			// 	deleteOriginalAssets: true,
			// 	generator: [ imgConfig(env, wpConfig) ]
			// });
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {webpack.optimize.LimitChunkCountPlugin | undefined}
	 */
	limitchunks: (env, wpConfig) =>
	{
		/** @type {webpack.optimize.LimitChunkCountPlugin | undefined} */
		let plugin;
		if (env.build === "browser")
		{
			plugin = new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 });
		}
		return plugin;
	},


	optimize:
	{
		/**
		 * @param {WebpackEnvironment} env
		 * @param {WebpackConfig} wpConfig Webpack config object
		 * @returns {webpack.NoEmitOnErrorsPlugin | undefined}
		 */
		noEmitOnError: (env, wpConfig) =>
		{
			let plugin;
			if (env.build !== "webview") // && wpConfig.mode === "production")
			{
				plugin = new webpack.NoEmitOnErrorsPlugin();
			}
			return plugin;
		}
	},


	tsc:
	{
		/**
		 * @param {WebpackEnvironment} env
		 * @returns {void}
		 */
		buildTests: (env) =>
		{
			// const tscArgs = [ "tsc", "-p", "./src/test/tsconfig.json" ];
			// spawnSync("npx", tscArgs, { cwd: env.buildPath, encoding: "utf8", shell: true });
			const npmArgs = [ "npm", "run", "build-test-suite" ];
			spawnSync("npx", npmArgs, { cwd: env.buildPath, encoding: "utf8", shell: true });
		},

		/**
		 * @param {WebpackEnvironment} env
		 * @returns {void}
		 */
		buildTypes: (env) =>
		{
			const tscArgs = [  "tsc", "-p", "./types" ];
			if (!fs.existsSync(path.join(env.buildPath, "types", "lib"))) {
				try { fs.unlinkSync(path.join(env.buildPath, "node_modules", ".cache", "tsconfig.tytpes.tsbuildinfo")); } catch {}
			}
			spawnSync("npx", tscArgs, { cwd: env.buildPath, encoding: "utf8", shell: true });
		}

	},


	/**
	 * @param {String[]} apps
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {HtmlPlugin[]}
	 */
	webviewapps: (apps, env, wpConfig) =>
	{
		const plugins = [];
		if (env.build === "webview")
		{
			apps.forEach(k => plugins.push(wpPlugin.html(k, env, wpConfig)));
		}
		return plugins;
	}

};


// /**
//  * @param {WebpackEnvironment} env
//  * @param {WebpackConfig} wpConfig Webpack config object
//  * @returns { ImageMinimizerPlugin.Generator<any> }
//  */
// const imgConfig = (env, wpConfig) =>
// {
// 	// @ts-ignore
// 	return env.imageOpt ?
// 	{
// 		type: "asset",
// 		implementation: ImageMinimizerPlugin.sharpGenerate,
// 		options: {
// 			encodeOptions: {
// 				webp: {
// 					lossless: true,
// 				},
// 			},
// 		},
// 	} :
// 	{
// 		type: "asset",
// 		implementation: ImageMinimizerPlugin.imageminGenerate,
// 		options: {
// 			plugins: [
// 			[
// 				"imagemin-webp",
// 				{
// 					lossless: true,
// 					nearLossless: 0,
// 					quality: 100,
// 					method: wpConfig.mode === "production" ? 4 : 0,
// 				}
// 			]]
// 		}
// 	};
// };

class InlineChunkHtmlPlugin
{
	constructor(htmlPlugin, patterns)
	{
		this.htmlPlugin = htmlPlugin;
		this.patterns = patterns;
	}

	getInlinedTag(publicPath, assets, tag)
	{
		if (
			(tag.tagName !== "script" || !(tag.attributes && tag.attributes.src)) &&
			(tag.tagName !== "link" || !(tag.attributes && tag.attributes.href))
		) {
			return tag;
		}

		let chunkName = tag.tagName === "link" ? tag.attributes.href : tag.attributes.src;
		if (publicPath) {
			chunkName = chunkName.replace(publicPath, "");
		}
		if (!this.patterns.some(pattern => chunkName.match(pattern))) {
			return tag;
		}

		const asset = assets[chunkName];
		if (!asset) {
			return tag;
		}

		return { tagName: tag.tagName === "link" ? "style" : tag.tagName, innerHTML: asset.source(), closeTag: true };
	}

	apply(compiler)
	{
		let publicPath = compiler.options.output.publicPath || "";
		if (publicPath && !publicPath.endsWith("/")) {
			publicPath += "/";
		}

		compiler.hooks.compilation.tap("InlineChunkHtmlPlugin", compilation => {
			const getInlinedTagFn = tag => this.getInlinedTag(publicPath, compilation.assets, tag);
			const sortFn = (a, b) => (a.tagName === "script" ? 1 : -1) - (b.tagName === "script" ? 1 : -1);
			this.htmlPlugin.getHooks(compilation).alterAssetTagGroups.tap("InlineChunkHtmlPlugin", assets => {
				assets.headTags = assets.headTags.map(getInlinedTagFn).sort(sortFn);
				assets.bodyTags = assets.bodyTags.map(getInlinedTagFn).sort(sortFn);
			});
		});
	}
}


module.exports = {
	wpPlugin
};

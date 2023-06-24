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
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerPlugin = require("fork-ts-checker-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const FilterWarningsPlugin = require("webpack-filter-warnings-plugin");
const ForkTsCheckerNotifierWebpackPlugin = require("fork-ts-checker-notifier-webpack-plugin");
const { join } = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// const TerserPlugin = require("terser-webpack-plugin");
// const ShebangPlugin = require("webpack-shebang-plugin");
// const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// const FilterWarningsPlugin = require("webpack-filter-warnings-plugin");

/** @typedef {import("./types/webpack").WebpackBuild} WebpackBuild */
/** @typedef {import("./types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("./types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("./types/webpack").WebpackPluginInstance} WebpackPluginInstance */

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
	 * @returns {WebpackPluginInstance}
	 */
	afterdone: (env, wpConfig) =>
	{
		// "AfterDonePlugin" MUST BE LAST IN THE PLUGINS ARRAY!!
		/** @type {WebpackPluginInstance | undefined} */
		let plugin;
		if (env.build !== "webview")
		{
			const // _env = { ...env },
				  _wpConfig = { ...wpConfig };
			plugin =
			{   /** @param {import("webpack").Compiler} compiler Compiler */
				apply: (compiler) =>
				{
					if (_wpConfig.mode === "production")
					{
						compiler.hooks.done.tap("AfterDonePlugin", () =>
						{
							try {
								renameSync(path.join(__dirname, "dist", "vendor.js.LICENSE.txt"), path.join(__dirname, "dist", "vendor.LICENSE"));
								renameSync(path.join(__dirname, "dist", "taskexplorer.js.LICENSE.txt"), path.join(__dirname, "dist", "taskexplorer.LICENSE"));
							} catch {}
						});
					}
					// if (_env.environment === "test")
					// {
					// 	const istanbulFileWriter = path.join(__dirname, "node_modules", "istanbul-lib-report", "lib", "file-writer.js");
					// 	if (fs.existsSync(istanbulFileWriter))
					// 	{
					// 		const regex = /new FileContentWriter\(fs\.openSync\(file, 'w'\)\);/mg,
					// 		      value = `new FileContentWriter(fs.openSync(file.replace(/[\\" ]/g, ""), 'w'));`,
					// 		      content = fs.readFileSync(istanbulFileWriter, "utf8").replace(regex,value);
					// 		fs.writeFileSync(istanbulFileWriter, content);
					// 	}
					// }
				}
			};
		}
		if (!plugin) {
			plugin = /** @type {WebpackPluginInstance} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	analyze:
	{
		/**
		 * @param {WebpackEnvironment} env
		 * @param {WebpackConfig} wpConfig Webpack config object
		 * @returns {BundleAnalyzerPlugin}
		 */
		bundle: (env, wpConfig) =>
		{
			/** @type {BundleAnalyzerPlugin | any  | undefined} */
			let plugin;
			if (env.analyze === true)
			{
				plugin = new BundleAnalyzerPlugin({ analyzerPort: "auto" });
			}
			if (!plugin) {
				plugin = /** @type {BundleAnalyzerPlugin} */(/** @type {unknown} */(undefined));
			}
			return plugin;
		},

		/**
		 * @param {WebpackEnvironment} env
		 * @param {WebpackConfig} wpConfig Webpack config object
		 * @returns {CircularDependencyPlugin}
		 */
		circular: (env, wpConfig) =>
		{
			/** @type {CircularDependencyPlugin | undefined} */
			let plugin;
			// if (env.analyze === true)
			// {
				plugin = new CircularDependencyPlugin(
				{
					cwd: __dirname,
					exclude: /node_modules/,
					failOnError: false,
					onDetected: ({ module: _webpackModuleRecord, paths, compilation }) =>
					{
						compilation.warnings.push(/** @type {*}*/(new webpack.WebpackError(paths.join(" -> "))));
					}
				});
			// }
			if (!plugin) {
				plugin = /** @type {CircularDependencyPlugin} */(/** @type {unknown} */(undefined));
			}
			return plugin;
		}
	},


	babel:
	{
		/**
		 * @param {WebpackEnvironment} env
		 * @returns {void}
		 */
		buildTests: (env) =>
		{
			// let babel = [
			// 	"babel", "./src/test/suite", "--out-dir", "./dist/test/suite", "--extensions", ".ts",
			// 	"--presets=@babel/preset-env,@babel/preset-typescript",
			// ];
			// spawnSync("npx", babel, { cwd: __dirname, encoding: "utf8", shell: true });
			// babel = [
			// 	"babel", "./src/test/run", "--out-dir", "./dist/test/run", "--extensions", ".ts",
			// 	"--presets=@babel/preset-env,@babel/preset-typescript",
			// ];
			// spawnSync("npx", babel, { cwd: __dirname, encoding: "utf8", shell: true });
			const babel = [
				"babel", "./src/test", "--out-dir", "./dist/test", "--extensions", ".ts",
				"--presets=@babel/preset-env,@babel/preset-typescript",
			];
			spawnSync("npx", babel, { cwd: __dirname, encoding: "utf8", shell: true });
		}
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {webpack.BannerPlugin}
	 */
	banner: (env, wpConfig) =>
	{
		/** @type {webpack.BannerPlugin | undefined} */
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
		if (!plugin) {
			plugin = /** @type {webpack.BannerPlugin} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {WebpackPluginInstance}
	 */
	beforecompile: (env, wpConfig) =>
	{
		const isTestsBuild = (env.build === "tests" || env.environment.startsWith("test"));
		/** @type {WebpackPluginInstance | undefined} */
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
								wpPlugin.babel.buildTests(_env);
							}
						} catch {}
					});
				}
			};
		}
		if (!plugin) {
			plugin = /** @type {WebpackPluginInstance} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {CleanWebpackPlugin}
	 */
	clean: (env, wpConfig) =>
	{
		/** @type {CleanWebpackPlugin | undefined} */
		let plugin;
		if (env.clean === true)
		{
			if (env.build === "webview")
			{
				const basePath = path.posix.join(__dirname.replace(/\\/g, "/"), "res");
				plugin = new CleanWebpackPlugin(
				{
					dry: false,
					dangerouslyAllowCleanPatternsOutsideProject: true,
					cleanOnceBeforeBuildPatterns: [
						path.posix.join(basePath, "css", "**"),
						path.posix.join(basePath, "js", "**"),
						path.posix.join(basePath, "page", "**")
					]
				});
			}
			else
			{
				plugin = new CleanWebpackPlugin(
				{
					dry: false,
					dangerouslyAllowCleanPatternsOutsideProject: true,
					cleanOnceBeforeBuildPatterns: wpConfig.mode === "production" ? [
						path.posix.join(__dirname.replace(/\\/g, "/"), "dist", "**"),
						path.posix.join(__dirname.replace(/\\/g, "/"), ".coverage", "**"),
						path.posix.join(__dirname.replace(/\\/g, "/"), ".nyc-output", "**"),
						"!dist/webview/app/**"
					] : [
						path.posix.join(__dirname.replace(/\\/g, "/"), "dist", "**"),
						"!dist/webview/app/**"
					]
				});
			}
		}
		if (!plugin) {
			plugin = /** @type {CleanWebpackPlugin} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	/**
	 * @param {String[]} apps
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {CopyPlugin}
	 */
	copy: (apps, env, wpConfig) =>
	{
		/** @type {CopyPlugin | undefined} */
		let plugin;
		const /** @type {CopyPlugin.Pattern[]} */patterns = [],
			  psx__dirname = __dirname.replace(/\\/g, "/"),
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
		if (!plugin) {
			plugin = /** @type {CopyPlugin} */(/** @type {unknown} */(undefined));
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
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {WebpackPluginInstance}
	 */
	filterwarnings: (env, wpConfig) =>
	{
		// @ts-ignore
		return new FilterWarningsPlugin(
		{
			exclude: [
				/Critical dependency\: the request of a dependency is an expression/,
				/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
			]
		});
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
			filename: path.posix.join(__dirname, "res", "page", `${wwwName}.html`),
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
	 * @returns {InlineChunkHtmlPlugin}
	 */
	htmlinlinechunks: (env, wpConfig) =>
	{
		/** @type {InlineChunkHtmlPlugin | undefined} */
		let plugin;
		if (env.build === "webview")
		{
			// plugin = new InlineChunkHtmlPlugin(HtmlPlugin, wpConfig.mode === "production" ? ["\\.css$"] : []);
			plugin = new InlineChunkHtmlPlugin(HtmlPlugin, []);
		}
		if (!plugin) {
			plugin = /** @type {InlineChunkHtmlPlugin} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {ImageMinimizerPlugin}
	 */
	imageminimizer: (env, wpConfig) =>
	{
		/** @type {ImageMinimizerPlugin | undefined} */
		let plugin;
		if (env.build === "webview" && wpConfig.mode !== "production")
		{
			// plugin = new ImageMinimizerPlugin({
			// 	deleteOriginalAssets: true,
			// 	generator: [ imgConfig(env, wpConfig) ]
			// });
		}
		if (!plugin) {
			plugin = /** @type {ImageMinimizerPlugin} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {webpack.optimize.LimitChunkCountPlugin}
	 */
	limitchunks: (env, wpConfig) =>
	{
		/** @type {webpack.optimize.LimitChunkCountPlugin | undefined} */
		let plugin;
		if (env.build === "browser")
		{
			plugin = new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 });
		}
		if (!plugin) {
			plugin = /** @type {webpack.optimize.LimitChunkCountPlugin} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	optimize:
	{
		/**
		 * @param {WebpackEnvironment} env
		 * @param {WebpackConfig} wpConfig Webpack config object
		 * @returns {webpack.NoEmitOnErrorsPlugin}
		 */
		noEmitOnError: (env, wpConfig) =>
		{
			/** @type {webpack.NoEmitOnErrorsPlugin | undefined} */
			let plugin;
			if (env.build !== "webview") // && wpConfig.mode === "production")
			{
				plugin = new webpack.NoEmitOnErrorsPlugin();
			}
			if (!plugin) {
				plugin = /** @type {webpack.NoEmitOnErrorsPlugin} */(/** @type {unknown} */(undefined));
			}
			return plugin;
		}
	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {webpack.SourceMapDevToolPlugin}
	 */
	sourcemaps: (env, wpConfig) =>
	{
		/** @type {webpack.SourceMapDevToolPlugin | undefined} */
		let plugin;
		if (env.build !== "webview" && wpConfig.mode !== "production" && env.build !== "tests")
		{
			const options = {
				test: /\.(js|jsx)($|\?)/i,
				exclude: /((vendor|runtime)\.js|node_modules)/,
				filename: "[name].js.map",
				// moduleFilenameTemplate: ".[resource-path]",
				// moduleFilenameTemplate: '[absolute-resource-path]',
				fallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]",
				// fileContext: "..",
				//
				// The bundled node_modules will produce reference tags within the main entry point
				// files in the form:
				//
				//     external commonjs "vscode"
				//     external-node commonjs "crypto"
				//     ...etc...
				//
				// This breaks the istanbul reporting library when the tests have completed and the
				// coverage report is being built (via nyc.report()).  Replace the quote and space
				// characters in this external reference name with filename firiendly characters.
				//
				/** @type {any} */moduleFilenameTemplate: (/** @type {any} */info) =>
				{
					if ((/[\" ]/).test(info.absoluteResourcePath)) {
						return info.absoluteResourcePath.replace(/\"/g, "").replace(/ /g, "_");
					}
					return `${info.absoluteResourcePath}`;
				}
			};
			if (env.environment === "dev" || wpConfig.mode === "development")
			{
				options.filename = "[name].js.map";
				options.moduleFilenameTemplate = "[absolute-resource-path]";
				// options.moduleFilenameTemplate = "../[resource-path]";
				// options.fallbackModuleFilenameTemplate = '[resource-path]?[hash]';
			}
			plugin = new webpack.SourceMapDevToolPlugin(options);
		}
		else {
			plugin = /** @type {webpack.SourceMapDevToolPlugin} */(/** @type {unknown} */(undefined));
		}
		return plugin;
	},


	tsc:
	{
		/**
		 * @param {WebpackEnvironment} env
		 * @returns {void}
		 */
		buildTests: (env) =>
		{
			const tscTests = [ "tsc", "-p", "./src/test/tsconfig.json" ];
			spawnSync("npx", tscTests, { cwd: __dirname, encoding: "utf8", shell: true });
		},

		/**
		 * @param {WebpackEnvironment} env
		 * @returns {void}
		 */
		buildTypes: (env) =>
		{
			const tscTypes = [  "tsc", "-p", "./types" ];
			if (!fs.existsSync(join(__dirname, "types", "lib"))) {
				try { fs.unlinkSync(join(__dirname, ".vscode", "tsconfig.test.buildinfo")); } catch {}
			}
			spawnSync("npx", tscTypes, { cwd: __dirname, encoding: "utf8", shell: true });
		}

	},


	/**
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {(ForkTsCheckerPlugin|ForkTsCheckerNotifierWebpackPlugin)[]}
	 */
	tscheck: (env, wpConfig) =>
	{
		/** @type {(ForkTsCheckerPlugin|ForkTsCheckerNotifierWebpackPlugin)[]} */
		const plugins = [];
		if (env.build === "webview")
		{
			plugins.push(
				new ForkTsCheckerPlugin(
				{
					async: false,
					formatter: "basic",
					typescript: {
						configFile: path.join(env.basePath, "tsconfig.json"),
					}
				})
			);
		}
		else if (env.build === "tests")
		{
			plugins.push(
				new ForkTsCheckerPlugin(
				{
					async: false,
					formatter: "basic",
					typescript: {
						// build: true,
						mode: "write-tsbuildinfo",
						configFile: path.join(__dirname, "src", "test", "tsconfig.json"),
					}
				})
			);
		}
		else
		{
			plugins.push(
				new ForkTsCheckerPlugin(
				{
					async: false,
					formatter: "basic",
					typescript: {
						// build: true,
						mode: "write-tsbuildinfo",
						configFile: path.join(__dirname, env.build === "browser" ? "tsconfig.browser.json" : "tsconfig.json"),
					}
				})
			);
		}
		// plugins.push(
		// 	new ForkTsCheckerNotifierWebpackPlugin({
		// 		title: "vscode-taskexplorer",
		// 		excludeWarnings: false
		// 	}),
		// );
		return plugins;
	},


	/**
	 * @param {String[]} apps
	 * @param {WebpackEnvironment} env
	 * @param {WebpackConfig} wpConfig Webpack config object
	 * @returns {HtmlPlugin[]}
	 */
	webviewapps: (apps, env, wpConfig) =>
	{
		/** @type {HtmlPlugin[]} */
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

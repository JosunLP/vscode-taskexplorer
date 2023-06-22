//@ts-check
// const fs = require("fs");
const glob = require('glob');
const path = require("path");
const JSON5 = require("json5");
const esbuild = require("esbuild");
// const figures = require("./common").figures;
const { spawnSync } = require("child_process");
const { wpPlugin } = require("./webpack.plugin");
// const nodeExternals = require("webpack-node-externals");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/** @typedef {import("./types/webpack").WebpackBuild} WebpackBuild */
/** @typedef {import("./types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("./types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("./types/webpack").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {"true"|"false"} BooleanString */
/** @typedef {{ mode: "none"|"development"|"production"|undefined, env: WebpackEnvironment, config: String[] }} WebpackArgs */

/********************************************************************************************
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! IMPORTANT NOTE !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! NEW VIEWS/PAGES NEED TO BE ADDED HERE IN ORDER TO BE COMPILED !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 ********************************************************************************************/
const webviewApps =
{
	home: "./home/home.ts",
	license: "./license/license.ts",
	monitor: "./monitor/monitor.tsx",
	parsingReport: "./parsingReport/parsingReport.ts",
	releaseNotes: "./releaseNotes/releaseNotes.ts",
	taskCount: "./taskCount/taskCount.ts",
	taskDetails: "./taskDetails/taskDetails.ts",
	taskUsage: "./taskUsage/taskUsage.ts",
	welcome: "./welcome/welcome.ts",
};


/**
 * Webpack Export
 *
 * @param {WebpackEnvironment} env Environment variable containing runtime options passed
 * to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`).
 * @param {WebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig|WebpackConfig[]}
 */
module.exports = (env, argv) =>
{
	env = Object.assign(
	{
		clean: false,
		analyze: false,
		esbuild: false,
		fa: "custom",
		imageOpt: true,
		environment: "prod",
		target: "node"
	}, env);
	
	Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(k)).forEach((k) =>
	{
		env[k] = String(env[k]).toLowerCase() == "true";
	});

	consoleWrite("Start Webpack build");
	consoleWrite("Environment:");
	consoleWrite(`   build         : ${env.build}`);
	consoleWrite(`   clean         : ${env.clean}`);
	consoleWrite(`   environment   : ${env.environment}`);
	consoleWrite(`   esbuild       : ${env.esbuild}`);
	consoleWrite(`   target        : ${env.target}`);
	if (argv) {
		consoleWrite("Arguments:");
		if (argv.env) {
			consoleWrite(`   environment   : ${argv.env}`);
		}
		if (argv.mode) {
			consoleWrite(`   mode          : ${argv.mode}`);
		}
		if (argv.config) {
			consoleWrite(`   config        : ${argv.config.join(", ")}`);
		}
	}

	if (env.build){
		consoleWrite(`Running environment specified build '${env.build}'`);
		return getWebpackConfig(env.build, env, argv);
	}

	if (env.environment === "test") {
		consoleWrite("Build test files");
		// env.esbuild = true;
		return [
			getWebpackConfig("extension", env, argv),
			getWebpackConfig("webview", { ...env, ...{ environment: "dev" }}, argv)
		];
	}

	if (env.environment === "testprod") {
		consoleWrite("Build test files (production compiled)");
		return [
			getWebpackConfig("extension", env, argv),
			getWebpackConfig("webview", { ...env, ...{ environment: "prod" }}, argv)
		];
	}

	consoleWrite("Build extension and webviews");
	return [
		getWebpackConfig("extension", env, argv),
		// getWebpackConfig("browser", env, argv),
		getWebpackConfig("webview", env, argv),
	];
};


const consoleWrite = (msg, icon, pad = "") =>
    console.log(`     ${pad}${icon || wpPlugin.figures.color.info}${msg ? " " + wpPlugin.figures.withColor(msg, wpPlugin.figures.colors.grey) : ""}`);


/**
 * @method
 * @private
 * @param {WebpackBuild} buildTarget
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig}
 */
const getWebpackConfig = (buildTarget, env, argv) =>
{   
	env.build = buildTarget;
	/**@type {WebpackConfig}*/
	const wpConfig = {};
	basepath(env);                // Base path
	mode(env, argv, wpConfig);    // Mode i.e. "production", "development", "none"
	target(env, wpConfig);        // Target i.e. "node", "webworker", "tests"
	context(env, wpConfig);       // Context for build
	entry(env, wpConfig);         // Entry points for built output
	externals(env, wpConfig)      // External modules
	optimization(env, wpConfig);  // Build optimization
	minification(env, wpConfig);  // Minification / Terser plugin options
	output(env, wpConfig);        // Output specifications
	plugins(env, wpConfig);       // Webpack plugins
	resolve(env, wpConfig);       // Resolve config
	rules(env, wpConfig);         // Loaders & build rules
	stats(wpConfig);              // Stats i.e. console output & verbosity
	wpConfig.name = `${buildTarget}:${wpConfig.mode}`;
	return wpConfig;
};


//
// *************************************************************
// *** BASEPATH                                               ***
// *************************************************************
//
/**
 * @method basepath
 * @param {WebpackEnvironment} env Webpack build environment
 */
const basepath = (env) =>
{
	if (env.build === "webview") {
		env.basePath = path.join(__dirname, "src", "webview", "app");
	}
	else {
		env.basePath = __dirname;
	}
};


//
// *************************************************************
// *** CONTEXT                                               ***
// *************************************************************
//
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const context = (env, wpConfig) =>
{
	if (env.build === "webview")
	{
		wpConfig.context = env.basePath;
	}
};


//
// *************************************************************
// *** DEVTOOL                                               ***
// *************************************************************
//
/**
 * Adds library mode webpack config `output` object.
 *
 * Possible devTool values:
 *
 *     none:                        : Recommended for prod builds w/ max performance
 *     inline-source-map:           : Possible when publishing a single file
 *     cheap-source-map
 *     cheap-module-source-map
 *     eval:                        : Recommended for de builds w/ max performance
 *     eval-source-map:             : Recommended for dev builds w/ high quality SourceMaps
 *     eval-cheap-module-source-map : Tradeoff for dev builds
 *     eval-cheap-source-map:       : Tradeoff for dev builds
 *     inline-cheap-source-map
 *     inline-cheap-module-source-map
 *     source-map:                  : Recommended for prod builds w/ high quality SourceMaps
 *
 * @method
 * @private
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const devTool = (env, wpConfig) =>
{   //
	// Disabled for this build - Using source-map-plugin - see webpack.plugin.js#sourcemaps
	//
	wpConfig.devtool = false;
};


//
// *************************************************************
// *** ENTRY POINTS                                          ***
// *************************************************************
//
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const entry = (env, wpConfig) =>
{
	if (env.build === "webview")
	{
		wpConfig.entry = webviewApps;
	}
	else
	{
		if (env.build !== "extension_tests")
		{
			wpConfig.entry =
			{
				"taskexplorer": {
					import: "./src/taskexplorer.ts",
					filename: "taskexplorer.js"
				}
			};
		}
		else
		{
			wpConfig.entry =
			{
				runTest: './src/test/runTest.ts',
				'suite/index': './src/test/suite/index.ts',
				...glob.sync('./src/test/suite/**/*.test.ts').reduce(function (obj, e) {
					obj['suite/' + path.parse(e).name] = e;
					return obj;
				}, {})
			};
			// wpConfig.entry =
			// {
			// 	runTest: './src/test/runTest.ts'
			// 	// runTest: {
			// 	// 	import: [
			// 	// 		'./src/test/runTest.ts',
			// 	// 		'./src/test/suite/index.ts',
			// 	// 		// @ts-ignore
			// 	// 		...glob.sync('./src/test/suite/**/*.test.ts').reduce(function (obj, e) {
			// 	// 				obj['suite/' + path.parse(e).name] = e;
			// 	// 				return obj;
			// 	// 			}, {})
			// 	// 	],
			// 	// 
			// 	// }
			// };
		}
	}
};


//
// *************************************************************
// *** EXTERNALS                                             ***
// *************************************************************
//
/**
 * @method
 * The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot
 * be webpack'ed, -> https://webpack.js.org/configuration/externals/
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const externals = (env, wpConfig) =>
{   //
	// All external node_modules are packaged into vendor.js
	//
	wpConfig.externals = { vscode: "commonjs vscode" };
};



//
// *************************************************************
// *** MINIFICATION                                          ***
// *************************************************************
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const minification = (env, wpConfig) =>
{   //
	// For production build, customize the minify stage
	// Webpack 5 performs minification built-in now for production builds.
	// Leaving this commented here in case it is ever needed again.
	//
	// if (wpConfig.mode === "production")
	// {
	// 	Object.assign(/** @type {WebpackOptimization}*/(wpConfig.optimization),
	// 	{
	// 		minimize: true,
	// 		minimizer: [
	// 			new TerserPlugin(
	// 			env.esbuild ?
	// 			{
	// 				minify: TerserPlugin.esbuildMinify,
	// 				terserOptions: {
	// 					// @ts-ignore
	// 					drop: ["debugger"],
	// 					// compress: true,
	// 					// mangle: true,   // Default `false`
	// 					format: "cjs",
	// 					minify: true,
	// 					sourceMap: false,
	// 					treeShaking: true,
	// 					// Keep the class names otherwise @log won"t provide a useful name
	// 					keepNames: true,
	// 					// keep_names: true,
	// 					target: "es2020",
	// 				}
	// 			} :
	// 			{
	// 				extractComments: false,
	// 				parallel: true,
	// 				terserOptions: {
	// 					compress: {
	// 						drop_debugger: true,
	// 					},
	// 					// compress: true,
	// 					// mangle: true,   // Default `false`
	// 					ecma: 2020,
	// 					sourceMap: false,
	// 					format: {},
	// 					// format: {       // Default {}
	// 					// 	comments: false, // default "some"
	// 					// 	shebang: true
	// 					// },
	// 					// toplevel (default false) - set to true to enable top level variable
	// 					// and function name mangling and to drop unused variables and functions.
	// 					// toplevel: false,
	// 					// nameCache: null,
	// 					// Keep the class names otherwise @log won"t provide a useful name
	// 					keep_classnames: true,
	// 					module: true,
	// 				},
	// 			})
	// 		]
	// 	});
	// }
};


//
// *************************************************************
// *** MODE                                                  ***
// *************************************************************
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const mode = (env, argv, wpConfig) =>
{
	if (!argv.mode)
	{
		if (env.environment === "dev") {
			wpConfig.mode = "development";
		}
		else if (env.environment === "test") {
			wpConfig.mode = "none";
		}
		else {
			wpConfig.mode = "production";
			// env.environment = "prod"; ~ "testprod"
		}
	}
	else
	{
		wpConfig.mode = argv.mode;
		if (argv.mode === "development") {
			env.environment = "dev";
		}
		else {
			env.environment = "prod";
		}
	}
};


//
// *************************************************************
// *** OPTIMIZATION                                          ***
// *************************************************************
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const optimization = (env, wpConfig) =>
{
	if (env.build !== "webview") // && env.environment !== "test")
	{
		wpConfig.optimization =
		{
			runtimeChunk: env.environment === "prod" || env.environment === "test" ? "single" : undefined,
			splitChunks: false
		};
		if (env.build !== "browser")
		{
			wpConfig.optimization.splitChunks = {
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]((?!(node-windows)).*)[\\/]/,
						name: "vendor",
						chunks: "all"
					}
				}
			}
		}
	}
	else {
		wpConfig.optimization = {};
	}
};


//
// *************************************************************
// *** OUTPUT                                                ***
// *************************************************************
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const output = (env, wpConfig) =>
{
	if (env.build === "webview")
	{
		wpConfig.output = {
			clean: env.clean === true ? { keep: /(img|font|readme|walkthrough)[\\/]/ } : undefined,
			path: path.join(__dirname, "res"),
			publicPath: "#{webroot}/",
			filename: (pathData, assetInfo) =>
			{
				let name = "[name]";
				if (pathData.chunk?.name) {
					name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
				}
				return `js/${name}.js`;
			}
		};
	}
	// else if (env.environment === "test")
	// {
	// 	wpConfig.output = {
	// 		globalObject: "this",
	// 		//libraryTarget: 'commonjs2',
	// 		path: path.join(__dirname, "dist"),
	// 		filename: '[name].js',
	// 		//library: {
	// 		//	type: "commonjs2"
	// 		//}
	// 		// module: true,
	// 		// chunkFormat: "commonjs",
	// 		library: {
	// 			type: "commonjs2"
	// 		}
	// 	};
	// }
	else
	{
		wpConfig.output = {
			clean: env.clean === true,
			path: env.build === "browser" ? path.join(__dirname, "dist", "browser") : path.join(__dirname, "dist"),
			filename: '[name].js',
			libraryTarget: 'commonjs2'
		};
	}
	
	devTool(env, wpConfig);
};


//
// *************************************************************
// *** PLUGINS                                               ***
// *************************************************************
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const plugins = (env, wpConfig) =>
{
	wpConfig.plugins = [
		wpPlugin.clean(env, wpConfig),
		wpPlugin.beforecompile(env, wpConfig),
		...wpPlugin.tscheck(env, wpConfig)
	];

	if (env.build === "webview")
	{
		const apps = Object.keys(webviewApps);
		wpConfig.plugins.push(
			wpPlugin.cssextract(env, wpConfig),
			...wpPlugin.webviewapps(apps, env, wpConfig),
			// @ts-ignore
			wpPlugin.htmlcsp(env, wpConfig),
			wpPlugin.htmlinlinechunks(env, wpConfig),
			wpPlugin.copy(apps, env, wpConfig),
			wpPlugin.imageminimizer(env, wpConfig)
		);
	}
	else
	{
		wpConfig.plugins.push(
			wpPlugin.sourcemaps(env, wpConfig),
			wpPlugin.limitchunks(env, wpConfig),
			wpPlugin.copy([], env, wpConfig)
		);
	}

	wpConfig.plugins.push(
		wpPlugin.optimize.noEmitOnError(env, wpConfig),
		wpPlugin.analyze.bundle(env, wpConfig),
		wpPlugin.analyze.circular(env, wpConfig),
		wpPlugin.banner(env, wpConfig),
		wpPlugin.replace(env, wpConfig),
		wpPlugin.afterdone(env, wpConfig)
	);

	wpConfig.plugins.slice().reverse().forEach((p, index, object) =>
	{
		if (!p) {
			/** @type {(WebpackPluginInstance|undefined)[]} */(wpConfig.plugins).splice(object.length - 1 - index, 1);
		}
	});
};


//
// *************************************************************
// *** RESOLVE                                               ***
// *************************************************************
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const resolve = (env, wpConfig) =>
{
	if (env.build !== "webview")
	{
		wpConfig.resolve =
		{   
			alias: {
				"@env": path.resolve(__dirname, "src", "lib", "env", env.build === "browser" ? "browser" : "node")
			},
			fallback: env.build === "browser" ? { path: require.resolve("path-browserify"), os: require.resolve("os-browserify/browser") } : undefined,
			mainFields: env.build === "browser" ? [ "browser", "module", "main" ] : [ "module", "main" ],
			extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ]
		};
	}
	else
	{
		wpConfig.resolve = {
			alias: {
				"@env": path.resolve(__dirname, "src", "lib", "env", "browser"),
			},
			extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
			modules: [env.basePath, "node_modules"],
		};
	}
};


//
// *************************************************************
// *** RULES                                                 ***
// *************************************************************
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
			include: path.join(__dirname, "src"),
			test: /\.tsx?$/,
			use: [ env.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: "es2020",
					tsconfigRaw: resolveTSConfig(path.join(env.basePath, "tsconfig.json")),
				},
			}:{
				loader: "ts-loader",
				options: {
					configFile: path.join(env.basePath, "tsconfig.json"),
					// experimentalWatchApi: true,
					transpileOnly: true,
				},
			}]
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
	else
	{
		wpConfig.module.rules.push(
		{
			exclude: [/node_modules/, /test/, /types/, /\.d\.ts$/ ],
			include: path.join(__dirname, "src"),
			test: /\.tsx?$/,
			use: [ env.esbuild ?
			{
				loader: "esbuild-loader",
				options: {
					implementation: esbuild,
					loader: "tsx",
					target: ["es2020", "chrome91", "node16.20"],
					tsconfigRaw: resolveTSConfig(
						path.join(__dirname, env.build === "browser" ? "tsconfig.browser.json" : "tsconfig.json"),
					)
				}
			} :
			{
				loader: "ts-loader",
				options: {
					configFile: path.join(__dirname, env.build === "browser" ? "tsconfig.browser.json" : "tsconfig.json"),
					// experimentalWatchApi: true,
					transpileOnly: true
				}
			}]
		});
	}
};


//
// *************************************************************
// *** STATS                                                 ***
// *************************************************************
/**
 * @method
 * @param {WebpackConfig} wpConfig Webpack config object
 */
// @ts-ignore
const stats = (wpConfig) =>
{
	wpConfig.stats = {
		preset: "errors-warnings",
		assets: true,
		colors: true,
		env: true,
		errorsCount: true,
		warningsCount: true,
		timings: true
	};

	wpConfig.infrastructureLogging = {
		level: "log" // enables logging required for problem matchers
	};
};


//
// *************************************************************
// *** RESOLVE TS.CONFIG                                     ***
// *************************************************************
/**
 * @param {String} tsConfigFile
 * @returns {String}
 */
const resolveTSConfig = (tsConfigFile) =>
{
	const result = spawnSync("npx", ["tsc", `-p ${tsConfigFile}`, "--showConfig"], {
		cwd: __dirname,
		encoding: "utf8",
		shell: true,
	});
	const data = result.stdout,
		  start = data.indexOf("{"),
		  end = data.lastIndexOf("}") + 1;
	return JSON5.parse(data.substring(start, end));
};


//
// *************************************************************
// *** TARGET                                               ***
// *************************************************************
/**
 * @method
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const target = (env, wpConfig) =>
{
	if (env.build === "webview"|| env.build === "browser") {
		wpConfig.target = "webworker";
	}
	else {
		wpConfig.target = "node";
	}
};

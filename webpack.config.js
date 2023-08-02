/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const {
	environment, figures, globalEnv, merge, printBanner, readConfigFiles, write, colors, withColor
} = require("./webpack/utils");

const {
	context, devtool, entry, experiments, externals, ignorewarnings, minification, mode, name,
	plugins, optimization, output, resolve, rules, stats, target, watch, getMode
} = require("./webpack/exports");

/** @typedef {import("./webpack/types").WpBuildApp} WpBuildApp */
/** @typedef {import("./webpack/types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("./webpack/types").WpBuildModule} WpBuildModule */
/** @typedef {import("./webpack/types").WebpackConfig} WebpackConfig */
/** @typedef {import("./webpack/types").WebpackTarget} WebpackTarget */
/** @typedef {import("./webpack/types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("./webpack/types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("./webpack/types").WpBuildGlobalEnvironment} WpBuildGlobalEnvironment */


/**
 * Export Webpack build config<WebpackConfig>(s)
 *
 * @param {Partial<WpBuildEnvironment>} env Environment variable containing runtime options passed
 * to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`).
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig|WebpackConfig[]}
 */
module.exports = (env, argv) =>
{
	const app = readConfigFiles();
	printBanner(app, getMode(env, argv), env);

	if (env.build)
	{
		return getBuildConfig(env, argv, app);
	}

	if (env.environment === "test")
	{
		return [
			getBuildConfig({ ...env, build: "extension" }, argv, app),
			getBuildConfig({ ...env, build: "webview", environment: "dev" }, argv, app)
		];
	}

	if (env.environment === "testprod")
	{
		return [
			getBuildConfig({ ...env, build: "extension" }, argv, app),
			getBuildConfig({ ...env, build: "webview", environment: "prod" }, argv, app)
		];
	}

	return [
		getBuildConfig({ ...env, build: "extension" }, argv, app),
		getBuildConfig({ ...env, build: "webview" }, argv, app)
	];
};


/**
 * @function Calls all exports.* exported functions to cnostruct a build configuration
 * @param {Partial<WpBuildEnvironment>} env Webpack build environment
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @param {WpBuildApp} app Webpack app config, read from `.wpbuildrc.json` and `package.json`
 * @returns {WebpackConfig}
 */
const getBuildConfig = (env, argv, app) =>
{
	const wpc = /** @type {WebpackConfig} */({}),
		  lApp = merge({}, app),
		  lEnv = merge({ app: lApp, argv }, env);
	target(lEnv, wpc);         // Target i.e. "node", "webworker", "tests"
	write(withColor(`Start Webpack build ${++globalEnv.buildCount } [${lEnv.build}][${lEnv.target}]`, colors.bold), null, false, figures.color.start);
	environment(lEnv, wpc);    // Base path / Build path
	mode(lEnv, argv, wpc);     // Mode i.e. "production", "development", "none"
	name(lEnv, wpc);           // Build name / label
	context(lEnv, wpc);        // Context for build
	experiments(lEnv, wpc);    // Set any experimental flags that will be used
	entry(lEnv, wpc);          // Entry points for built output
	externals(lEnv, wpc);      // External modules
	ignorewarnings(lEnv, wpc); // Warnings from the compiler to ignore
	optimization(lEnv, wpc);   // Build optimization
	minification(lEnv, wpc);   // Minification / Terser plugin options
	output(lEnv, wpc);         // Output specifications
	devtool(lEnv, wpc);        // Dev tool / sourcemap control
	resolve(lEnv, wpc);        // Resolve config
	rules(lEnv, wpc);          // Loaders & build rules
	stats(lEnv, wpc);          // Stats i.e. console output & verbosity
	watch(lEnv, wpc);          // Watch-mode options
	plugins(lEnv, wpc);        // Plugins - exports.plugins() inits all plugin.plugins
	return wpc;
};

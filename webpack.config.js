/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { globalEnv } = require("./webpack/utils/global");
const { write, figures } = require("./webpack/utils/console");
const { merge, printBanner, readConfigFiles } = require("./webpack/utils/utils");
const {
	context, devtool, entry, experiments, externals, ignorewarnings, minification, mode, name,
	plugins, optimization, output, resolve, rules, stats, target, watch, environment, getMode
} = require("./webpack/exports");

/** @typedef {import("./webpack/types").WpBuildApp} WpBuildApp */
/** @typedef {import("./webpack/types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("./webpack/types").WpBuildModule} WpBuildModule */
/** @typedef {import("./webpack/types").WebpackConfig} WebpackConfig */
/** @typedef {import("./webpack/types").WebpackTarget} WebpackTarget */
/** @typedef {import("./webpack/types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("./webpack/types").WpBuildEnvironment} WpBuildEnvironment */
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
	const appRc = readConfigFiles(),
		  mode = getMode(env, argv),
		  mEnv = merge(getDefaultBuildEnv(), env);

	printBanner(appRc, mode, env, argv);

	if (mEnv.build)
	{
		return getBuildConfig(mEnv.build, appRc, mEnv, argv);
	}
	else if (mEnv.environment === "test")
	{
		return [
			getBuildConfig("extension", appRc, { ...mEnv }, argv),
			getBuildConfig("webview", appRc, { ...mEnv, environment: "dev" }, argv)
		];
	}
	else if (mEnv.environment === "testprod")
	{
		return [
			getBuildConfig("extension", appRc, { ...mEnv }, argv),
			getBuildConfig("webview", appRc, { ...mEnv, environment: "prod" }, argv)
		];
	}

	return [
		getBuildConfig("extension", appRc, { ...mEnv }, argv),
		getBuildConfig("webview", appRc, { ...mEnv }, argv)
	];
};


/**
 * @function getBuildConfig
 * @param {WpBuildModule} build
 * @param {WpBuildApp} app Webpack app config, read from `.wpbuildrc.json` and `package.json`
 * @param {Partial<WpBuildEnvironment>} env Webpack build environment
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig}
 */
const getBuildConfig = (build, app, env, argv) =>
{
	const wpConfig = /** @type {WebpackConfig} */({}),
		  lEnv = /** @type {WpBuildEnvironment} */(merge({}, env));
	write(`Start Webpack build step ${++globalEnv.buildCount }`, figures.color.start);
	//
	// Calling all exports.()...
	//
	environment(build, app, lEnv, argv, wpConfig); // Base path / Build path
	mode(lEnv, argv, wpConfig);     // Mode i.e. "production", "development", "none"
	name(build, lEnv, wpConfig);    // Build name / label
	target(lEnv, wpConfig);         // Target i.e. "node", "webworker", "tests"
	context(lEnv, wpConfig);        // Context for build
	experiments(lEnv, wpConfig);    // Set any experimental flags that will be used
	entry(lEnv, wpConfig);          // Entry points for built output
	externals(lEnv, wpConfig);      // External modules
	ignorewarnings(lEnv, wpConfig); // Warnings from the compiler to ignore
	optimization(lEnv, wpConfig);   // Build optimization
	minification(lEnv, wpConfig);   // Minification / Terser plugin options
	output(lEnv, wpConfig);         // Output specifications
	devtool(lEnv, wpConfig);        // Dev tool / sourcemap control
	resolve(lEnv, wpConfig);        // Resolve config
	rules(lEnv, wpConfig);          // Loaders & build rules
	stats(lEnv, wpConfig);          // Stats i.e. console output & verbosity
	watch(lEnv, wpConfig, argv);    // Watch-mode options
	//
	// exports.plugins() calls all plugin.plugins...  last, when all env props are fully populated
	//
	plugins(lEnv, wpConfig, argv);  // Plugins
	return wpConfig;
};


/**
 * @function getDefaultBuildEnv
 * @returns {Partial<WpBuildEnvironment>}
 */
const getDefaultBuildEnv = () =>
{
	/** @type {Partial<WpBuildEnvironment>} */
	const env = {
		analyze: false,
		clean: false,
		esbuild: false,
		imageOpt: true,
		isTests: false,
		paths: /** @type {WpBuildPaths} */({}),
		preRelease: true,
		state: { hash: { current: {}, next: {} } },
		target: /** @type {WebpackTarget} */("node"),
		verbosity: undefined
	};
	Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
	{
		env[k] = env[k].toLowerCase() === "true";
	});
	return env;
};

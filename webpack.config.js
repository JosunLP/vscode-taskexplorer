/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const globalEnv = require("./webpack/utils/global");
const { write, figures } = require("./webpack/utils/console");
const { merge, printBanner, readConfigFiles } = require("./webpack/utils/utils");
const {
	context, devtool, entry, externals, ignorewarnings, minification, mode, name, plugins,
	optimization, output, resolve, rules, stats, target, watch, environment, getMode
} = require("./webpack/exports");

/** @typedef {import("./webpack/types").IWebpackApp} IWebpackApp */
/** @typedef {import("./webpack/types").WebpackArgs} WebpackArgs */
/** @typedef {import("./webpack/types").WebpackBuild} WebpackBuild */
/** @typedef {import("./webpack/types").WebpackConfig} WebpackConfig */
/** @typedef {import("./webpack/types").WebpackTarget} WebpackTarget */
/** @typedef {import("./webpack/types").WebpackBuildMode} WebpackBuildMode */
/** @typedef {import("./webpack/types").WebpackBuildPaths} WebpackBuildPaths */
/** @typedef {import("./webpack/types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("./webpack/types").WebpackGlobalEnvironment} WebpackGlobalEnvironment */


/**
 * Export Webpack build config<WebpackConfig>(s)
 *
 * @param {Partial<WebpackEnvironment>} env Environment variable containing runtime options passed
 * to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`).
 * @param {WebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig|WebpackConfig[]}
 */
module.exports = (env, argv) =>
{
	const appRc = readConfigFiles(),
		  mode = getMode(env, argv);

	printBanner(appRc, mode, env, argv);

	const mEnv = merge(getDefaultBuildEnv(), env);

	const extBuild = [
		getBuildConfig("extension", appRc, { ...mEnv, buildMode: "debug" /* , clean: true */ }, argv),
		getBuildConfig("extension", appRc, { ...mEnv, buildMode: "release" }, argv)
	];

	if (mEnv.build)
	{
		if (mEnv.build !== "extension") {
			return getBuildConfig(mEnv.build, appRc, mEnv, argv);
		}
		return extBuild;
	}
	else if (mEnv.mEnvironment === "test")
	{
		return [ ...extBuild, getBuildConfig("webview", appRc, { ...mEnv, environment: "dev" }, argv) ];
	}
	else if (mEnv.environment === "testprod")
	{
		return [ ...extBuild, getBuildConfig("webview", appRc, { ...mEnv, environment: "prod" }, argv) ];
	}
	return [ ...extBuild, getBuildConfig("webview", appRc, mEnv, argv) ];
};


/**
 * @function getBuildConfig
 * @param {WebpackBuild} build
 * @param {IWebpackApp} app Webpack app config, read from `.wpbuildrc.json` and `package.json`
 * @param {Partial<WebpackEnvironment>} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig}
 */
const getBuildConfig = (build, app, env, argv) =>
{
	write(`Start Webpack build step ${++globalEnv.buildCount }`, figures.color.start);
	/** @type {WebpackEnvironment}*/
	// @ts-ignore
	const lEnv = merge({}, env);
	/** @type {WebpackConfig}*/
	const wpConfig = /** @type {WebpackConfig} */({});
	environment(build, app, lEnv, argv, wpConfig); // Base path / Build path
	mode(lEnv, argv, wpConfig);     // Mode i.e. "production", "development", "none"
	name(build, lEnv, wpConfig);    // Build name / label
	target(lEnv, wpConfig);         // Target i.e. "node", "webworker", "tests"
	context(lEnv, wpConfig);        // Context for build
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
	plugins(lEnv, wpConfig);        // Plugins - call last - `env` & `wpConfig` are fully populated
	return wpConfig;
};


/**
 * @function getDefaultBuildEnv
 * @returns {Partial<WebpackEnvironment>}
 */
const getDefaultBuildEnv = () =>
{
	const env = {
		analyze: false,
		buildMode: /** @type {WebpackBuildMode} */("release"),
		clean: false,
		esbuild: false,
		fa: "custom",
		imageOpt: true,
		isTests: false,
		paths: /** @type {WebpackBuildPaths} */({ files: { hash: "" }, cache: "" }),
		preRelease: true,
		state: { hash: { current: {}, next: {} } },
		target: /** @type {WebpackTarget} */("node")
	};
	Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
	{
		env[k] = env[k].toLowerCase() === "true";
	});
	return env;
};

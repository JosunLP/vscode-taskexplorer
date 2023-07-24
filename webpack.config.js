/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const { writeInfo } = require("./webpack/console");
const { merge, printSpmBanner } = require("./webpack/utils");
const {
	context, devtool, entry, externals, ignorewarnings, minification, mode, name, plugins,
	optimization, output, resolve, rules, stats, target, watch, environment, getMode
} = require("./webpack/exports");

/** @typedef {import("./webpack/types").WebpackArgs} WebpackArgs */
/** @typedef {import("./webpack/types").WebpackBuild} WebpackBuild */
/** @typedef {import("./webpack/types").WebpackConfig} WebpackConfig */
/** @typedef {import("./webpack/types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("./webpack/types").WebpackGlobalEnvironment} WebpackGlobalEnvironment */


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
	/** @type {WebpackGlobalEnvironment} */
	const gEnv = { buildCount: 0 };
	const mode = getMode(env, argv);

	writeInfo("------------------------------------------------------------------------------------------------------------------------");
	printSpmBanner("0.0.1");
	writeInfo("------------------------------------------------------------------------------------------------------------------------");
	writeInfo(" Start Task Explorer VSCode Extension Webpack Build");
	writeInfo("------------------------------------------------------------------------------------------------------------------------");
	writeInfo("   Mode  : " + mode);
	writeInfo("   Argv  : " + JSON.stringify(argv));
	writeInfo("   Env   : " + JSON.stringify(env));
	writeInfo("------------------------------------------------------------------------------------------------------------------------");

	env = merge(
	{
		clean: false,
		analyze: false,
		environment: "prod",
		esbuild: false,
		fa: "custom",
		imageOpt: true,
		preRelease: true,
		stripLogging: true,
		target: "node",
		paths: { files: { hash: "" }, cache: "" },
		state: { hash: { current: {}, next: {} } }
	}, env);

	Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
	{
		env[k] = env[k].toLowerCase() === "true";
	});

	const extBuild = [
		getWebpackConfig("extension", { ...env, ...{ stripLogging: false /* , clean: true */ }}, gEnv, argv),
		getWebpackConfig("extension", { ...env, ...{ stripLogging: true }}, gEnv, argv)
	];

	if (env.build)
	{
		if (env.build !== "extension") {
			return getWebpackConfig(env.build, env, gEnv, argv);
		}
		return extBuild;
	}

	if (env.environment === "test") {
		return [ ...extBuild, getWebpackConfig("webview", { ...env, ...{ environment: "dev" }}, gEnv, argv) ];
	}

	if (env.environment === "testprod") {
		return [ ...extBuild, getWebpackConfig("webview", { ...env, ...{ environment: "prod" }}, gEnv, argv) ];
	}

	return [ ...extBuild, getWebpackConfig("webview", { ...env }, gEnv, argv) ];
};

/**
 * @method getWebpackConfig
 * @param {WebpackBuild} buildTarget
 * @param {WebpackEnvironment} env Webpack build environment
 * @param {WebpackGlobalEnvironment} gEnv Webpack global environment
 * @param {WebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig}
 */
const getWebpackConfig = (buildTarget, env, gEnv, argv) =>
{
	if (gEnv.buildCount > 0) { console.log(""); }
	writeInfo(`Start Webpack build step ${++gEnv.buildCount }`);
	/** @type {WebpackEnvironment}*/
	const lEnv = merge({}, env);
	/** @type {WebpackConfig}*/
	const wpConfig = {};
	environment(buildTarget, lEnv, argv);  // Base path / Build path
	mode(lEnv, argv, wpConfig);            // Mode i.e. "production", "development", "none"
	name(buildTarget, lEnv, wpConfig);     // Build name / label
	target(lEnv, wpConfig);                // Target i.e. "node", "webworker", "tests"
	context(lEnv, wpConfig);               // Context for build
	entry(lEnv, wpConfig);                 // Entry points for built output
	externals(lEnv, wpConfig);             // External modules
	ignorewarnings(lEnv, wpConfig);        // Warnings from the compiler to ignore
	optimization(lEnv, wpConfig);          // Build optimization
	minification(lEnv, wpConfig);          // Minification / Terser plugin options
	output(lEnv, wpConfig);                // Output specifications
	devtool(lEnv, wpConfig);               // Dev tool / sourcemap control
	resolve(lEnv, wpConfig);               // Resolve config
	rules(lEnv, wpConfig);                 // Loaders & build rules
	stats(lEnv, wpConfig);                 // Stats i.e. console output & verbosity
	watch(lEnv, wpConfig, argv);		   // Watch-mode options
	plugins(lEnv, gEnv, wpConfig);          // Plugins - call last as `env` and `wpConfig` are cloned for hooks
	return wpConfig;
};

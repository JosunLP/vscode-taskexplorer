/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const globalEnv = require("./webpack/global");
const { writeInfo, write } = require("./webpack/console");
const { merge, printSpmBanner } = require("./webpack/utils");
const {
	context, devtool, entry, externals, ignorewarnings, minification, mode, name, plugins,
	optimization, output, resolve, rules, stats, target, watch, environment, getMode
} = require("./webpack/exports");
const gradient = require("gradient-string");
const { colors, withColor } = require("@spmeesseman/test-utils");

/** @typedef {import("./webpack/types").WebpackArgs} WebpackArgs */
/** @typedef {import("./webpack/types").WebpackBuild} WebpackBuild */
/** @typedef {import("./webpack/types").WebpackConfig} WebpackConfig */
/** @typedef {import("./webpack/types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("./webpack/types").WebpackGlobalEnvironment} WebpackGlobalEnvironment */


/**
 * Webpack exports.
 *
 * @param {Partial<WebpackEnvironment>} env Environment variable containing runtime options passed
 * to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`).
 * @param {WebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig|WebpackConfig[]}
 */
module.exports = (env, argv) =>
{
	const mode = getMode(env, argv);

	writeInfo("------------------------------------------------------------------------------------------------------------------------");
	printSpmBanner("0.0.1");
	writeInfo("------------------------------------------------------------------------------------------------------------------------");
	write(gradient.fruit(" Start Task Explorer VSCode Extension Webpack Build"));
	writeInfo("------------------------------------------------------------------------------------------------------------------------");
	write(withColor("   Mode  : ", colors.white) + withColor(mode, colors.grey));
	write(withColor("   Argv  : ", colors.white) + withColor(JSON.stringify(argv), colors.grey));
	write(withColor("   Env   : ", colors.white) + withColor(JSON.stringify(env), colors.grey));
	writeInfo("------------------------------------------------------------------------------------------------------------------------");

	env = merge(
	{
		clean: false,
		analyze: false,
		esbuild: false,
		fa: "custom",
		imageOpt: true,
		preRelease: true,
		buildMode: "release",
		target: "node",
		paths: { files: { hash: "" }, cache: "" },
		state: { hash: { current: {}, next: {} } }
	}, env);

	Object.keys(env).filter(k => typeof env[k] === "string" && /(?:true|false)/i.test(env[k])).forEach((k) =>
	{
		env[k] = env[k].toLowerCase() === "true";
	});

	const extBuild = [
		getWebpackConfig("extension", { ...env, ...{ buildMode: "debug" /* , clean: true */ }}, argv),
		getWebpackConfig("extension", { ...env, ...{ buildMode: "release" }}, argv)
	];

	if (env.build)
	{
		if (env.build !== "extension") {
			return getWebpackConfig(env.build, env, argv);
		}
		return extBuild;
	}

	if (env.environment === "test") {
		return [ ...extBuild, getWebpackConfig("webview", { ...env, ...{ environment: "dev" }}, argv) ];
	}

	if (env.environment === "testprod") {
		return [ ...extBuild, getWebpackConfig("webview", { ...env, ...{ environment: "prod" }}, argv) ];
	}

	return [ ...extBuild, getWebpackConfig("webview", { ...env }, argv) ];
};


/**
 * @function getWebpackConfig
 * @param {WebpackBuild} build
 * @param {Partial<WebpackEnvironment>} env Webpack build environment
 * @param {WebpackArgs} argv Webpack command line args
 * @returns {WebpackConfig}
 */
const getWebpackConfig = (build, env, argv) =>
{
	if (globalEnv.buildCount > 0) { console.log(""); }
	writeInfo(`Start Webpack build step ${++globalEnv.buildCount }`);
	/** @type {WebpackEnvironment}*/
	// @ts-ignore
	const lEnv = merge({}, env);
	/** @type {WebpackConfig}*/
	const wpConfig = /** @type {WebpackConfig} */({});
	environment(build, lEnv, argv, wpConfig); // Base path / Build path
	mode(lEnv, argv, wpConfig);               // Mode i.e. "production", "development", "none"
	name(build, lEnv, wpConfig);              // Build name / label
	target(lEnv, wpConfig);                   // Target i.e. "node", "webworker", "tests"
	context(lEnv, wpConfig);                  // Context for build
	entry(lEnv, wpConfig);                    // Entry points for built output
	externals(lEnv, wpConfig);                // External modules
	ignorewarnings(lEnv, wpConfig);           // Warnings from the compiler to ignore
	optimization(lEnv, wpConfig);             // Build optimization
	minification(lEnv, wpConfig);             // Minification / Terser plugin options
	output(lEnv, wpConfig);                   // Output specifications
	devtool(lEnv, wpConfig);                  // Dev tool / sourcemap control
	resolve(lEnv, wpConfig);                  // Resolve config
	rules(lEnv, wpConfig);                    // Loaders & build rules
	stats(lEnv, wpConfig);                    // Stats i.e. console output & verbosity
	watch(lEnv, wpConfig, argv);		      // Watch-mode options
	plugins(lEnv, wpConfig);                  // Plugins - call last as `env` and `wpConfig` are cloned for hooks
	return wpConfig;
};

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.config
 *
 * The webpack build package files from the @spmeesseman/wpbuild package are a colleactive set of
 * organized plugins and export configurations adaptable to a variety of different project builds.
 *
 * This file is the default Webpack configuration file that returns a webpack.Configuration object,
 * or an array of webpack.Configuration objects, to the Webpack engine.
 *
 * This file calls calls into each module in exports/* to construct the build config for each
 * that'sspecified build.  The call to the export/plugins.js module will itself call into each
 * module located in plugin/*.
 *
 * Modules in the  exports directory are generally named to the export property on the webpack
 * config object, e.g. ruls.js correspnds to the `riles` property, etc.
 *
 * Modules located in the plugin directory are generally named after the action that they are
 * performing, e.g. `loghooks.js` logs each hook  when it starts.  If anything, logging each stage
 * definitely to gives a good grasp on how a webpack build proceeds.
 */


const { environment, globalEnv, merge, app, WpBuildConsoleLogger } = require("./webpack/utils");
const {
	cache, context, devtool, entry, experiments, externals, ignorewarnings, minification,
	mode, name, plugins, optimization, output, resolve, rules, stats, target, watch, getMode
} = require("./webpack/exports");

/** @typedef {import("./webpack/types").WpBuildApp} WpBuildApp */
/** @typedef {import("./webpack/types").WpBuildAppRc} WpBuildAppRc */
/** @typedef {import("./webpack/types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("./webpack/types").WpBuildModule} WpBuildModule */
/** @typedef {import("./webpack/types").WebpackConfig} WebpackConfig */
/** @typedef {import("./webpack/types").WebpackTarget} WebpackTarget */
/** @typedef {import("./webpack/types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("./webpack/types").WpBuildWebpackArgs} WpBuildWebpackArgs */
/** @typedef {import("./webpack/types").WpBuildWebpackConfig} WpBuildWebpackConfig */
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
	const mode = getMode(env, argv),
		  wpa = new app(mode, env);
	if (env.build) {
		return buildConfig(getEnv(env, wpa.rc, argv));
	}
	const envMode = env.environment || (mode === "development" ? "dev" : (mode === "production" ? "prod" : "test"));
	return wpa.rc.builds[envMode].map(b => buildConfig(getEnv(env, wpa.rc, argv, b)));
};


/**
 * @function Calls all exports.* default expoirts to construct a {@link WebpackConfig webpack build configuration}
 * @param {WpBuildEnvironment} env Webpack build environment
 * @returns {WebpackConfig}
 */
const buildConfig = (env) =>
{
	target(env);         // Target i.e. "node", "webworker", "web"
	environment(env);    // Environment properties, e.g. paths, etc
	write(env);          // Log build start after target and env is known
	mode(env);           // Mode i.e. "production", "development", "none"
	name(env);           // Build name / label
	cache(env);          // Asset cache
	context(env);        // Context for build
	experiments(env);    // Set any experimental flags that will be used
	entry(env);          // Entry points for built output
	externals(env);      // External modules
	ignorewarnings(env); // Warnings from the compiler to ignore
	optimization(env);   // Build optimization
	minification(env);   // Minification / Terser plugin options
	output(env);         // Output specifications
	devtool(env);        // Dev tool / sourcemap control
	resolve(env);        // Resolve config
	rules(env);          // Loaders & build rules
	stats(env);          // Stats i.e. console output & verbosity
	watch(env);          // Watch-mode options
	plugins(env);        // Plugins - exports.plugins() inits all plugin.plugins
	return env.wpc;
};


/**
 * @function
 * @param {Partial<WpBuildEnvironment>} env Webpack build environment
 * @param {WpBuildAppRc} app
 * @param {WpBuildWebpackArgs} argv Webpack command line args
 * @param {Record<string, any>} [opts] Additional options too apply to WpBuildEnvironment
 * @returns {WpBuildEnvironment}
 */
const getEnv = (env, app, argv, opts) => /** @type {WpBuildEnvironment} */(
	merge({ app, argv, wpc: /** @type {WebpackConfig} */({}) }, { ...env, ...(opts || {}) })
);


/**
 * @function
 * @param {WpBuildEnvironment} env Webpack build environment
 */
const write = (env) =>
{
	const l = env.logger;
	l.value(
		`Start Webpack build ${++globalEnv.buildCount}`,
		l.tagColor(env.build, l.colors.cyan, l.colors.white) + " " + l.tagColor(env.target, l.colors.cyan, l.colors.white),
		undefined, undefined, l.icons.color.start, l.colors.white
	);
};

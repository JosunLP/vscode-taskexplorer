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


const { environment, globalEnv, merge, WpBuildRc } = require("./webpack/utils");
const {
	cache, context, devtool, entry, experiments, externals, ignorewarnings, minification,
	mode, name, plugins, optimization, output, resolve, rules, stats, target, watch, getMode
} = require("./webpack/exports");

/** @typedef {import("./webpack/types").WpBuildApp} WpBuildApp */
/** @typedef {import("./webpack/types").WebpackMode} WebpackMode */
/** @typedef {import("./webpack/types").WpBuildPaths} WpBuildPaths */
/** @typedef {import("./webpack/types").WpBuildModule} WpBuildModule */
/** @typedef {import("./webpack/types").WebpackConfig} WebpackConfig */
/** @typedef {import("./webpack/types").WebpackTarget} WebpackTarget */
/** @typedef {import("./webpack/types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("./webpack/types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("./webpack/types").WpBuildWebpackConfig} WpBuildWebpackConfig */
/** @typedef {import("./webpack/types").WebpackRuntimeEnvArgs} WebpackRuntimeEnvArgs */
/** @typedef {import("./webpack/types").WpBuildGlobalEnvironment} WpBuildGlobalEnvironment */


/**
 * Export Webpack build config<WebpackConfig>(s)
 *
 * @param {WebpackRuntimeEnvArgs} env Environment variable containing runtime options passed
 * to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`).
 * @param {WebpackRuntimeArgs} argv Webpack command line args
 * @returns {WebpackConfig|WebpackConfig[]}
 */
module.exports = (env, argv) =>
{
	const mode = getMode(env, argv),
		  rc = new WpBuildRc(mode, argv, env);
	if (env.build) {
		return buildConfig(getApp(mode, env, argv));
	}
	const envMode = env.environment || (mode === "development" ? "dev" : (mode === "production" ? "prod" : "test"));
	return app.rc.builds[envMode].map(b => buildConfig(getApp(mode, env, argv, b)));
};


/**
 * @function Calls all exports.* default expoirts to construct a {@link WebpackConfig webpack build configuration}
 * @param {WpBuildApp} app Webpack build environment
 * @returns {WebpackConfig}
 */
const buildConfig = (app) =>
{
	target(app);         // Target i.e. "node", "webworker", "web"
	environment(app);    // Environment properties, e.g. paths, etc
	write(app);          // Log build start after target and env is known
	mode(app);           // Mode i.e. "production", "development", "none"
	name(app);           // Build name / label
	cache(app);          // Asset cache
	context(app);        // Context for build
	experiments(app);    // Set any experimental flags that will be used
	entry(app);          // Entry points for built output
	externals(app);      // External modules
	ignorewarnings(app); // Warnings from the compiler to ignore
	optimization(app);   // Build optimization
	minification(app);   // Minification / Terser plugin options
	output(app);         // Output specifications
	devtool(app);        // Dev tool / sourcemap control
	resolve(app);        // Resolve config
	rules(app);          // Loaders & build rules
	stats(app);          // Stats i.e. console output & verbosity
	watch(app);          // Watch-mode options
	plugins(app);        // Plugins - exports.plugins() inits all plugin.plugins
	return app.wpc;
};


/**
 * @function
 * @param {WebpackMode} mode Webpack build environment
 * @param {WebpackRuntimeEnvArgs} env Webpack build environment
 * @param {WebpackRuntimeArgs} argv Webpack command line args
 * @param {Record<string, any>} [opts] Additional options too apply to WpBuildEnvironment
 * @returns {WpBuildApp}
 */
const getApp = (mode, env, argv, opts) =>  new WpBuildRc(mode, argv, env);


/**
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const write = (app) =>
{
	const l = app.logger;
	l.value(
		`Start Webpack build ${++globalEnv.buildCount}`,
		l.tag(app.build, l.colors.cyan, l.colors.white) + " " + l.tag(app.target, l.colors.cyan, l.colors.white),
		undefined, undefined, l.icons.color.start, l.colors.white
	);
};

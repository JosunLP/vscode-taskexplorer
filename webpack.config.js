/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file types/app.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 *
 * @description
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
 *
 * NOTE: {@link WpBuildPlugin} for steps to take when adding a new plugin,
 *
 * Handy file links:
 *
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 */


const WpBuildRc = require("./webpack/utils/rc");
const WpBuildApp = require("./webpack/utils/app");
const { globalEnv } = require("./webpack/utils/global");
const {
	cache, context, devtool, entry, experiments, externals, ignorewarnings, minification,
	mode, name, plugins, optimization, output, resolve, rules, stats, target, watch, getMode
} = require("./webpack/exports");

/** @typedef {import("./webpack/plugin/base")} WpBuildPlugin */
/** @typedef {import("./webpack/types").WpBuildRcBuild} WpBuildRcBuild */
/** @typedef {import("./webpack/types").WebpackRuntimeArgs} WebpackRuntimeArgs */
/** @typedef {import("./webpack/types").WpBuildWebpackConfig} WpBuildWebpackConfig */
/** @typedef {import("./webpack/types").WpBuildRuntimeEnvArgs} WpBuildRuntimeEnvArgs */


/**
 * Exports Webpack build configs to the webpack engine... the build(s) start here.
 * @param {WpBuildRuntimeEnvArgs} env Environment variable containing runtime options passed
 * to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`)
 * as opposed to the "correct" way i.e. webpack --env environment=test --env clean`
 * @param {WebpackRuntimeArgs} argv Webpack command line args
 * @returns {WpBuildWebpackConfig|WpBuildWebpackConfig[]}
 */
const exportConfigs = (env, argv) =>
{
	const mode = getMode(env, argv),
		  rc = new WpBuildRc(mode, argv, env);
	if (env.build) {
		return buildConfig(new WpBuildApp(argv, env, rc, globalEnv));
	}
	const envMode = env.environment || (mode === "development" ? "dev" : (mode === "production" ? "prod" : "test"));
	return rc.environment[envMode].builds.map(build => buildConfig(getApp(env, argv, rc, build)));
};


/**
 * Calls each ./exports/* default export to construct a {@link WpBuildWebpackConfig webpack build configuration}
 * @function
 * @param {WpBuildApp} app Webpack build environment
 * @returns {WpBuildWebpackConfig}
 */
const buildConfig = (app) =>
{
	target(app);         // Target i.e. "node", "webworker", "web"
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
 * Creates an {@link WpBuildApp `app` instance} that acts as a unique wrapper for each build. As opposed
 * to the {@link WpBuildRc `rc` instance} which is shared by all builds.
 * @function
 * @param {WpBuildRuntimeEnvArgs} env Webpack build environment
 * @param {WebpackRuntimeArgs} argv Webpack command line args
 * @param {WpBuildRc} rc Webpack command line args
 * @param {WpBuildRcBuild} [build]
 * @returns {WpBuildApp}
 */
const getApp = (env, argv, rc, build) =>  new WpBuildApp(argv, env, rc, globalEnv, build);


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


module.exports = exportConfigs;

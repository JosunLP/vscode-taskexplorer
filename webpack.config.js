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
 * NOTE: {@link typedefs.WpBuildPlugin WpBuildPlugin} for steps to take when adding a new plugin,
 *
 * Handy file links:
 *
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 */


const typedefs = require("./webpack/types/typedefs");
const WpBuildRc = require("./webpack/utils/rc");
const WpBuildApp = require("./webpack/utils/app");
const { globalEnv } = require("./webpack/utils/global");
const {
	cache, context, devtool, entry, experiments, externals, ignorewarnings, minification,
	mode, name, plugins, optimization, output, resolve, rules, stats, target, watch, getMode
} = require("./webpack/exports");


/**
 * Exports Webpack build configs to the webpack engine... the build(s) start here.
 * Eenvironment "flags" in arge should be set on the cmd line e.g. `--env=property`, as opposed
 * to `--env property=true`, but any "boolean strings" will be converted to `true` to a booleans
 *
 * @function
 *
 * @param {typedefs.WpBuildRuntimeEnvArgs} arge Environment variable containing runtime options passed
 * to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`)
 * as opposed to the "correct" way i.e. webpack --env environment=test --env clean`
 * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line args
 * @returns {typedefs.WpBuildWebpackConfig | typedefs.WpBuildWebpackConfig[]}
 */
const exportConfigs = (arge, argv) =>
{
	Object.keys(arge).filter(k => typeof arge[k] === "string" && /(?:true|false)/i.test(arge[k])).forEach((k) =>
	{
		arge[k] = arge[k].toLowerCase() === "true";
	});
	const rc = new WpBuildRc(argv, arge);
	return rc.builds.map((build) => buildConfig(new WpBuildApp(argv, arge, rc, globalEnv, build)));
};


/**
 * Calls each ./exports/* default export to construct a {@link typedefs.WpBuildWebpackConfig webpack build configuration}
 *
 * @function
 * @param {WpBuildApp} app Webpack build environment
 * @returns {typedefs.WpBuildWebpackConfig}
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
 * @function
 * @param {WpBuildApp} app Webpack build environment
 */
const write = (app) =>
{
	const l = app.logger;
	l.value(
		`Start Webpack build ${++globalEnv.buildCount}`,
		l.tag(app.build.name, l.colors.cyan, l.colors.white) + " " + l.tag(app.target, l.colors.cyan, l.colors.white),
		undefined, undefined, l.icons.color.start, l.colors.white
	);
};


module.exports = exportConfigs;

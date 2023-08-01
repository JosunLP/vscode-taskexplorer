/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.build
 */

const fs = require("fs");
const path = require("path");
const WpBuildBasePlugin = require("./base");
const { spawnSync } = require("child_process");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */



/**
 * @class WpBuildCompilePlugin
 */
class WpBuildPreBuildPlugin extends WpBuildBasePlugin
{
    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            types: {
                hook: "beforeCompile",
                callback: () =>
				{
					this.buildTypes();
					if (this.options.env.isTests) {
						this.buildTests();
					}
				}
            }
        });
    }


	/**
	 * @function
	 * @private
	 */
	buildTests()
	{
		const { env } = this.options;
		// const tscArgs = [ "tsc", "-p", "./src/test/tsconfig.json" ];
		// spawnSync("npx", tscArgs, { cwd: env.paths.build, encoding: "utf8", shell: true });
		const npmArgs = [ "npm", "run", "build-test-suite" ];
		spawnSync("npx", npmArgs, { cwd: env.paths.build, encoding: "utf8", shell: true });
	}


	/**
	 * @function
	 * @private
	 */
	buildTypes()
	{
		const { env } = this.options;
		/** @type {import("child_process").SpawnSyncOptions} */
		const spawnOptions = { cwd: env.paths.build, encoding: "utf8", shell: true };
		if (!fs.existsSync(path.join(env.paths.build, "types", "dist")))
		{
			// try { fs.unlinkSync(path.join(env.paths.build, "node_modules", ".cache", "tsconfig.tsbuildinfo")); } catch {}
			try { fs.unlinkSync(path.join(env.paths.build, "node_modules", ".cache", "tsconfig.types.tsbuildinfo")); } catch {}
		}
		// else if (!fs.existsSync(path.join(env.paths.build, "types", "dist", "lib")))
		// {
		// 	try { fs.unlinkSync(path.join(env.paths.build, "node_modules", ".cache", "tsconfig.tsbuildinfo")); } catch {}
		// }
		spawnSync("npx", [ "tsc", "-p", "./types" ], spawnOptions);
		// spawnSync("npx", [ "tsc", "--emitDeclarationOnly", "-p", "./" ], spawnOptions);
	}

	// babel:
	// {
	// 	/**
	// 	 * @param {WpBuildEnvironment} env
	// 	 * @returns {void}
	// 	 */
	// 	buildTests: (env) =>
	// 	{
	// 		// let babel = [
	// 		// 	"babel", "./src/test/suite", "--out-dir", "./dist/test/suite", "--extensions", ".ts",
	// 		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
	// 		// ];
	// 		// spawnSync("npx", babel, { cwd: env.paths.build, encoding: "utf8", shell: true });
	// 		// babel = [
	// 		// 	"babel", "./src/test/run", "--out-dir", "./dist/test/run", "--extensions", ".ts",
	// 		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
	// 		// ];
	// 		// spawnSync("npx", babel, { cwd: env.paths.build, encoding: "utf8", shell: true });
	// 		const babel = [
	// 			"babel", "./src/test", "--out-dir", "./dist/test", "--extensions", ".ts",
	// 			"--presets=@babel/preset-env,@babel/preset-typescript",
	// 		];
	// 		spawnSync("npx", babel, { cwd: env.paths.build, encoding: "utf8", shell: true });
	// 	}
	// }

}


/**
 * @param {WpBuildEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WpBuildPreBuildPlugin | undefined}
 */
const build = (env, wpConfig) =>
	(env.app.plugins.build !== false && env.build !== "webview" ? new WpBuildPreBuildPlugin({ env, wpConfig }) : undefined);


module.exports = build;

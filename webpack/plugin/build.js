/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.build
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const build = (env, wpConfig) =>
{
	const isTestsBuild = (env.build === "tests" || env.environment.startsWith("test"));
	let plugin;
	if (env.build !== "webview")
	{
		const _env = { ...env };
		plugin =
		{   /** @param {import("webpack").Compiler} compiler Compiler */
			apply: (compiler) =>
			{
				compiler.hooks.beforeCompile.tap("BeforeCompilePlugin", () =>
				{
					try {
						tsc.buildTypes(_env);
						if (isTestsBuild) {
							tsc.buildTests(_env);
						}
					} catch {}
				});
			}
		};
	}
	return plugin;
};


// babel:
// {
// 	/**
// 	 * @param {WebpackEnvironment} env
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
// },


const tsc =
{
	/**
	 * @param {WebpackEnvironment} env
	 * @returns {void}
	 */
	buildTests: (env) =>
	{
		// const tscArgs = [ "tsc", "-p", "./src/test/tsconfig.json" ];
		// spawnSync("npx", tscArgs, { cwd: env.paths.build, encoding: "utf8", shell: true });
		const npmArgs = [ "npm", "run", "build-test-suite" ];
		spawnSync("npx", npmArgs, { cwd: env.paths.build, encoding: "utf8", shell: true });
	},

	/**
	 * @param {WebpackEnvironment} env
	 * @returns {void}
	 */
	buildTypes: (env) =>
	{
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
};


module.exports = build;

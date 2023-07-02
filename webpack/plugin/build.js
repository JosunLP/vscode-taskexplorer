/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.build
 */

const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */


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
// 		// spawnSync("npx", babel, { cwd: env.buildPath, encoding: "utf8", shell: true });
// 		// babel = [
// 		// 	"babel", "./src/test/run", "--out-dir", "./dist/test/run", "--extensions", ".ts",
// 		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
// 		// ];
// 		// spawnSync("npx", babel, { cwd: env.buildPath, encoding: "utf8", shell: true });
// 		const babel = [
// 			"babel", "./src/test", "--out-dir", "./dist/test", "--extensions", ".ts",
// 			"--presets=@babel/preset-env,@babel/preset-typescript",
// 		];
// 		spawnSync("npx", babel, { cwd: env.buildPath, encoding: "utf8", shell: true });
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
		// spawnSync("npx", tscArgs, { cwd: env.buildPath, encoding: "utf8", shell: true });
		const npmArgs = [ "npm", "run", "build-test-suite" ];
		spawnSync("npx", npmArgs, { cwd: env.buildPath, encoding: "utf8", shell: true });
	},

	/**
	 * @param {WebpackEnvironment} env
	 * @returns {void}
	 */
	buildTypes: (env) =>
	{
		const tscArgs = [  "tsc", "-p", "./types" ];
		if (!fs.existsSync(path.join(env.buildPath, "types", "lib"))) {
			try { fs.unlinkSync(path.join(env.buildPath, "node_modules", ".cache", "tsconfig.tytpes.tsbuildinfo")); } catch {}
		}
		spawnSync("npx", tscArgs, { cwd: env.buildPath, encoding: "utf8", shell: true });
	}

};


module.exports = build;

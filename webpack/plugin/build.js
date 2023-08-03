/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.build
 */

const path = require("path");
const { join } = require("path");
const WpBuildBasePlugin = require("./base");
const { spawnSync, exec } = require("child_process");
const { existsSync, unlinkSync } = require("fs");
const { readdir, readFile, unlink } = require("fs/promises");
const { WebpackError } = require("webpack");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WebpackCompilationParams} WebpackCompilationParams */



/**
 * @class WpBuildCompilePlugin
 */
class WpBuildPreCompilePlugin extends WpBuildBasePlugin
{
    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            // types: {
            //     hook: "beforeCompile",
            //     callback: (params) =>
			// 	{
			// 		this.buildTypes(/** @type {WebpackCompilationParams} */(params));
			// 		if (this.env.isTests) {
			// 			this.buildTests(/** @type {WebpackCompilationParams} */(params));
			// 		}
			// 	}
            // },
			typesAndTests: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: "precompile",
                callback: this.build.bind(this)
            }
        });
    }


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} assets
	 */
	async build(assets)
	{
		await this.buildTypes(assets);
		if (this.env.isTests) {
			await this.buildTests(assets);
		}
	};


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} assets
	 */
	async buildTests(assets)
	{
		const logger = this.env.logger,
			  bldDir = this.env.paths.build,
			  npmArgs =  [ "npx", "tsc", "-p", "./src/test/tsconfig.json" ], // [ "npm", "run", "build-test-suite" ],
			  testsDir = join(this.env.paths.dist, "test");

		logger.writeInfo("build tests");

		if (!existsSync(testsDir))
		{
			try { await unlink(path.join(bldDir, "node_modules", ".cache", "tsconfig.test.tsbuildinfo")); } catch {}
		}

		// spawnSync("npx", tscArgs, { cwd: env.paths.build, encoding: "utf8", shell: true });
		// spawnSync("npx", npmArgs, { cwd: bldDir, encoding: "utf8", shell: true });
		try {
			await exec.__promisify__(npmArgs.join(" "), { cwd: bldDir, encoding: "utf8" /* , shell: true */ });
		}
		catch (e) {
			this.compilation.errors.push(new WebpackError(e.message));
			logger.error(e);
			return;
		}

		if (existsSync(testsDir))
		{
			const files = await readdir(testsDir);
			for (const file of files.filter(f => (/\.js/).test(f)))
			{
				const source = await readFile(join(testsDir, file)),
					  dstAsset = this.compilation.getAsset(file);
				// let cacheEntry;
				// this.logger.debug(`getting cache for '${absoluteFilename}'...`);
				// try {
				// 	cacheEntry = this.cache.get(`${sourceFilename}|${index}`, null, () => {});
				// }
				// catch (/** @type {WebpackError} */e) {
				// 	this.compilation.errors.push(e);
				// 	return;
				// }
				if (!dstAsset)
				{
					logger.value("   emit asset", file);
					this.compilation.emitAsset(file, new this.compiler.webpack.sources.RawSource(source), { precompile: true, immutable: true });
				}
				else if (this.options.force) {
					logger.value("   update asset", file);
					this.compilation.updateAsset(file, new this.compiler.webpack.sources.RawSource(source), { precompile: true, immutable: true });
				}
			}
		}
		else {
			logger.warning("build tests failed - output directory does not exist");
		}
	}


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} assets
	 */
	async buildTypes(assets)
	{
		/** @type {import("child_process").SpawnSyncOptions} */
		const spawnOptions = { cwd: this.env.paths.build, encoding: "utf8", shell: true };
		this.env.logger.writeInfo("build types");
		if (!existsSync(path.join(this.env.paths.build, "types", "dist")))
		{
			// try { fs.unlinkSync(path.join(env.paths.build, "node_modules", ".cache", "tsconfig.tsbuildinfo")); } catch {}
			try { await unlink(path.join(this.env.paths.build, "node_modules", ".cache", "tsconfig.types.tsbuildinfo")); } catch {}
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
 * @returns {WpBuildPreCompilePlugin | undefined}
 */
const build = (env) =>
	(env.app.plugins.build !== false && env.build !== "webview" ? new WpBuildPreCompilePlugin({ env }) : undefined);


module.exports = build;

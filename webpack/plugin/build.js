/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.build
 */

const { existsSync } = require("fs");
const { promisify } = require("util");
const { findFiles } = require("../utils");
const { WebpackError } = require("webpack");
const WpBuildBasePlugin = require("./base");
const {readFile, unlink, access, statfs } = require("fs/promises");
const { join, basename, relative } = require("path");
const exec = promisify(require("child_process").exec);
// const spawn = promisify(require("child_process").spawn);

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
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
	 * @param {WebpackCompilationAssets} _assets
	 */
	async buildTests(_assets)
	{
		const logger = this.env.logger,
			  bldDir = this.env.paths.build,
			  testsDir = join(this.env.paths.dist, "test");
		logger.writeInfo("build test suite");
		if (!existsSync(testsDir))
		{
			try { await unlink(join(bldDir, "node_modules", ".cache", "tsconfig.test.tsbuildinfo")); } catch {}
		}
		logger.writeInfo("   execute italic(tsc) build for tests suite");
		const procPromise = exec("npx tsc -p ./src/test", { cwd: bldDir, encoding: "utf8" });
		await this.postProcess(testsDir, procPromise);
	}


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} _assets
	 */
	async buildTypes(_assets)
	{
		const logger = this.env.logger,
			  bldDir = this.env.paths.build,
			  typesDir = join(bldDir, "types", "dist");
		this.env.logger.writeInfo("build types");
		if (!existsSync(typesDir))
		{
			try { await unlink(join(bldDir, "node_modules", ".cache", "tsconfig.types.tsbuildinfo")); } catch {}
		}
		logger.writeInfo("   execute italic(tsc) build for types");
		const procPromise = exec("npx tsc -p ./types", { cwd: bldDir, encoding: "utf8" });
		await this.postProcess(typesDir, procPromise);
	}


	/**
	 * @private
	 * @param {WebpackCompilation} compilation
	 * @param {number} startTime
	 * @param {string} dependency
	 * @returns {Promise<WebpackSnapshot | undefined>}
	 */
	async createSnapshot(compilation, startTime, dependency)
	{
		return new Promise((resolve, reject) =>
		{
			compilation.fileSystemInfo.createSnapshot(
				startTime, [ dependency ], // @ts-ignore
				undefined, undefined, null,
				(error, snapshot) =>
				{
					if (error) {
						reject(error);
					}
					else {
						resolve(/** @type {WebpackSnapshot} */snapshot);
					}
				}
			);
		});
	}


	/**
	 * @private
	 * @param {WebpackCompilation} compilation
	 * @param {WebpackSnapshot} snapshot
	 * @returns {Promise<boolean | undefined>}
	 */
	async checkSnapshotValid(compilation, snapshot)
	{
		return new Promise((resolve, reject) =>
		{
			compilation.fileSystemInfo.checkSnapshotValid(snapshot, (error, isValid) =>
			{
				if (error) {
					reject(error);
				}
				else {
					resolve(isValid);
				}
			});
		});
	}


	/**
	 * @private
	 * @param {WebpackCompiler} compiler
	 * @param {WebpackCompilation} compilation
	 * @param {Buffer} source
	 * @returns {string}
	 */
	getContentHash(compiler, compilation, source)
	{
		const { outputOptions } = compilation;
		const {hashDigest, hashDigestLength, hashFunction, hashSalt } = outputOptions;
		const hash = compiler.webpack.util.createHash(/** @type {string} */hashFunction);
		if (hashSalt) {
			hash.update(hashSalt);
		}
		hash.update(source);
		const fullContentHash = hash.digest(hashDigest);
		return fullContentHash.toString().slice(0, hashDigestLength);
	}


	/**
	 * @function
	 * @private
	 * @param {string} dir
	 * @param {import("child_process").PromiseWithChild<{ stdout: string; stderr: string;}>} procPromise
	 */
	postProcess = async (dir, procPromise) =>
	{
		const logger = this.env.logger,
			  child = procPromise.child;
		try
		{
			child.stdout?.on("data", (data) => void logger.value("   stdout", data));
			child.stderr?.on("data", (data) => void logger.value("   stderr", data));
			child.on("close", (code) => void logger.writeInfo(`   tsc build completed with exit code bold(${code})`));

			const { stdout, stderr } = await procPromise;

			logger.value("   tsc stdout", stdout);
			logger.value("   tsc stderr", stderr);

			await access(dir);

			const files = await findFiles("**/*.js", { nocase: true, cwd: dir, absolute: true  });
			for (const filePath of files)
			{
				const filePathRel = relative(dir, filePath),
					  file = basename(filePathRel);
				let source,
					cacheEntry;

				logger.writeInfo(`   check cache for '${filePathRel}'...`);
				try {
					cacheEntry = await this.cache.getPromise(`${filePath}|${index}`, null);
				}
				catch (e) {
					this.compilation.errors.push(e);
					return;
				}

				if (cacheEntry)
				{
					let isValidSnapshot;
					logger.writeInfo(`   checking snapshot on valid for '${filePathRel}'...`);
					try {
						isValidSnapshot = await this.checkSnapshotValid(this.compilation, cacheEntry.snapshot);
					}
					catch (e) {
						this.compilation.errors.push(/** @type {WebpackError} */e);
						return;
					}
					if (isValidSnapshot)
					{
						logger.writeInfo(`   snapshot for '${filePathRel}' is valid`);
						({ source } = cacheEntry);
					}
					else {
						logger.writeInfo(`   snapshot for '${filePathRel}' is invalid`);
					}
				}

				if (!source)
				{
					let snapshot;
					const startTime = Date.now();
					const data = await readFile(filePath);
					source = new this.compiler.webpack.sources.RawSource(data);
					try {
						snapshot = await this.createSnapshot(this.compilation, startTime, filePath);
					}
					catch (e) {
						this.compilation.errors.push(/** @type {WebpackError} */e);
						return;
					}
					if (snapshot) {
						logger.writeInfo(`created snapshot for '${filePathRel}'`);
						logger.writeInfo(`storing cache for '${filePathRel}'...`);
						try {
							await this.cache.storePromise(`${filePathRel}|${index}`, null, { source, snapshot });
						}
						catch (e) {
							this.compilation.errors.push(/** @type {WebpackError} */e);
							return;
						}
						logger.writeInfo(`stored cache for '${filePathRel}'`);
					}
				}

				const info = {
					absoluteFilename: filePath,
					sourceFilename: file,
					filename: file,
					precompile: true,
					development: true,
					immutable: true
				};

				const existingAsset = this.compilation.getAsset(file);

				if (!existingAsset)
				{
					logger.value("   emit asset", filePathRel);
					this.compilation.emitAsset(file, new this.compiler.webpack.sources.RawSource(source), info);
				}
				else if (this.options.force) {
					logger.value("   update asset", filePathRel);
					this.compilation.updateAsset(file, new this.compiler.webpack.sources.RawSource(source), info);
				}
			}
		}
		catch (e) {
			logger.warning(`build 'test suite' failed: ${e.message}`);
		}
	};


	// babel:
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
}


/**
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildPreCompilePlugin | undefined}
 */
const build = (env) =>
	(env.app.plugins.build !== false && env.build !== "webview" ? new WpBuildPreCompilePlugin({ env }) : undefined);


module.exports = build;

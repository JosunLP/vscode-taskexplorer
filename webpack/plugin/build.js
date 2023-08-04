/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.build
 */

const { existsSync } = require("fs");
const { promisify } = require("util");
const { findFiles } = require("../utils");
const WpBuildBasePlugin = require("./base");
const { join, basename, relative } = require("path");
const exec = promisify(require("child_process").exec);
// const spawn = promisify(require("child_process").spawn);
const {readFile, unlink, access } = require("fs/promises");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WebpackCompilationParams} WebpackCompilationParams */


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
		await this.types(assets);
		if (this.env.isTests) {
			// await this.testsuite(assets);
		}
	};


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} _assets
	 */
	async testsuite(_assets)
	{
		const bldDir = this.env.paths.build,
			  testsDir = join(this.env.paths.dist, "test");
		this.env.logger.write("build test suite");
		if (!existsSync(testsDir))
		{
			try { await unlink(join(bldDir, "node_modules", ".cache", "tsconfig.test.tsbuildinfo")); } catch {}
		}
		await this.execTsBuild("./src/test", 2, testsDir, true);
	}


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} _assets
	 */
	async types(_assets)
	{
		const bldDir = this.env.paths.build,
			  typesDir = join(bldDir, "types", "dist");
		this.env.logger.write("build types");
		if (!existsSync(typesDir))
		{
			try { await unlink(join(bldDir, "node_modules", ".cache", "tsconfig.types.tsbuildinfo")); } catch {}
		}
		await this.execTsBuild("./types", 1, typesDir);
	}


	/**
	 * @function Executes a typescript build using the specified tsconfig
	 * @private
	 * @param {string} tsConfig Path to tsconfig file or dir, relative to `env.paths.build`
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 */
	execTsBuild = async (tsConfig, identifier, outputDir, alias) =>
	{
		// const babel = [
		// 	"npx", "babel", tsConfig, "--out-dir", outputDir, "--extensions", ".ts",
		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
		// ];
		const logger = this.env.logger;
		let command = `npx tsc -p ${tsConfig}`; // babel.join(" ");
		logger.write(`   execute typescript build @ italic(${tsConfig})`, 1);

		try
		{
			let procPromise = exec(command, { cwd: this.env.paths.build, encoding: "utf8" }),
				child = procPromise.child;
			child.stdout?.on("data", (data) => void logger.value("   tsc stdout", data));
			child.stderr?.on("data", (data) => void logger.value("   tsc stderr", data));
			child.on("close", (code) => void logger.write(`   typescript build completed with exit code bold(${code})`));
			await procPromise;
			//
			// Ensure target directory exists
			//
			await access(outputDir);
			//
			// Run `tsc-alias` for path aliasing if specified.
			//
			if (alias)
			{   //
				// Note that `tsc-alias` requires a filename e.g. tsconfig.json in it's path argument
				//
				if (!(/tsconfig\.(?:[\w\-_\.]+\.)?json$/).test(tsConfig)) {
					tsConfig = join(tsConfig, "tsconfig.json");
				}
				command = `tsc-alias -p ${tsConfig}`;
				procPromise = exec(command, { cwd: this.env.paths.build, encoding: "utf8" });
				child = procPromise.child;
				child.stdout?.on("data", (data) => void logger.value("   tsc-alias stdout", data));
				child.stderr?.on("data", (data) => void logger.value("   tsc-alias stderr", data));
				child.on("close", (code) => void logger.write(`   typescript path aliasing completed with exit code bold(${code})`));
				await procPromise;
			}
			//
			// Process output files
			//
			const files = await findFiles("**/*.js", { nocase: true, cwd: outputDir, absolute: true });
			for (const filePath of files)
			{
				let data, source, hash, cacheEntry, cacheEntry2;
				const filePathRel = relative(outputDir, filePath),
					  file = basename(filePathRel);

				this.compilation.buildDependencies.add(file);

				logger.value("   check cache", filePathRel, 3);
				try {
					cacheEntry2 = this.cache2.get();
					cacheEntry = await this.cache.getPromise(`${filePath}|${identifier}`, null);
				}
				catch (e) {
					this.handleError(e, "failed while checking cache");
					return;
				}

				if (cacheEntry2)
				{
					data = data || await readFile(filePath);
					const newHash = this.getContentHash(data);
					if (newHash === cacheEntry2[filePathRel])
					{
						logger.value("   asset unchanged", filePathRel, 3);
						this.compilation.comparedForEmitAssets.add(file);
						continue;
					}
					cacheEntry2[filePathRel] = newHash;
					this.cache2.set(cacheEntry2);
				}

				if (cacheEntry)
				{
					let isValidSnapshot;
					logger.value("   check snapshot valid", filePathRel, 3);
					try {
						isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
					}
					catch (e) {
						this.handleError(e, "failed while checking snapshot");
						return;
					}
					if (isValidSnapshot)
					{
						logger.value("   snapshot valid", filePathRel, 3);
						({ hash, source } = cacheEntry);
						data = data || await readFile(filePath);
						const newHash = this.getContentHash(data);
						if (newHash === hash)
						{
							logger.value("   asset unchanged", filePathRel, 3);
							this.compilation.comparedForEmitAssets.add(file);
							return;
						}
					}
					else {
						logger.write(`   snapshot for '${filePathRel}' is invalid`, 3);
					}
				}

				if (!source)
				{
					let snapshot;
					const startTime = Date.now();
					data = data || await readFile(filePath);
					source = new this.compiler.webpack.sources.RawSource(data);
					logger.value("   create snapshot", filePathRel, 3);
					try {
						snapshot = await this.createSnapshot(startTime, filePath);
					}
					catch (e) {
						this.handleError(e, "failed while creating snapshot");
						return;
					}
					if (snapshot)
					{
						// console.log("########: ");
						// console.log("hasContextHashes: " + snapshot.hasContextHashes());
						// console.log("hasFileHashes: " + snapshot.hasFileHashes());
						// console.log("hasFileTimestamps: " + snapshot.hasFileTimestamps());
						// console.log("hasStartTime: " + snapshot.hasStartTime());

						logger.value("   cache snapshot", filePathRel, 3);
						try {
							const hash = this.getContentHash(source.buffer());
							snapshot.setFileHashes(hash);
							await this.cache.storePromise(`${filePath}|${identifier}`, null, { source, snapshot, hash });

							cacheEntry = await this.cache.getPromise(`${filePath}|${identifier}`, null);
							// if (cacheEntry)
							// {
							// 	console.log("!!!!!!!!!!: " + cacheEntry.hash);
							// 	console.log("hasContextHashes: " + snapshot.hasContextHashes());
							// 	console.log("hasFileHashes: " + snapshot.hasFileHashes());
							// 	console.log("hasFileTimestamps: " + snapshot.hasFileTimestamps());
							// 	console.log("hasStartTime: " + snapshot.hasStartTime());
							// }
						}
						catch (e) {
							this.handleError(e, "failed while caching snapshot");
							return;
						}
					}
				}

				const info = {
					absoluteFilename: filePath,
					sourceFilename: filePathRel,
					filename: file,
					precompile: true,
					development: true,
					immutable: true
				};

				const existingAsset = this.compilation.getAsset(filePathRel);
				if (!existingAsset)
				{
					logger.value("   add asset", filePathRel, 2);
					this.compilation.additionalChunkAssets.push(filePathRel);
					// logger.value("   emit asset", filePathRel, 2);
					// this.compilation.emitAsset(file, source, info);
				}
				// else if (this.options.force) {
				// 	logger.value("   update asset", filePathRel, 2);
				// 	this.compilation.updateAsset(file, source, info);
				// }

				this.compilation.comparedForEmitAssets.add(filePathRel);
			}
		}
		catch (e) {
			this.handleError(e, "typescript build failed");
		}
	};

}


/**
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildPreCompilePlugin | undefined}
 */
const build = (env) =>
	(env.app.plugins.build !== false && env.build !== "webview" ? new WpBuildPreCompilePlugin({ env }) : undefined);


module.exports = build;

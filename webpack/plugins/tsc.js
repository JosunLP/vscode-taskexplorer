/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/testsuite.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const dts = require("dts-bundle");
const { existsSync } = require("fs");
const WpBuildPlugin = require("./base");
const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const {readFile, unlink, access } = require("fs/promises");
const { join, relative, dirname, isAbsolute, resolve } = require("path");
const { findFiles, getTsConfig, WpBuildError, findTsConfig } = require("../utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("../types").WebpackAssetInfo} WebpackAssetInfo */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WebpackCompilationParams} WebpackCompilationParams */


class WpBuildTscPlugin extends WpBuildPlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
			// buildTestsSuite: {
			// 	async: true,
            //     hook: "compilation",
			// 	stage: "ADDITIONAL",
			// 	statsProperty: "tests",
			// 	statsPropertyColor: "magenta",
            //     callback: this.testsuite.bind(this)
            // },
			buildTypes: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: "types",
				statsPropertyColor: this.app.rc.log.color || "blue",
                callback: this.testsuite.bind(this)
            },
			bundleDtsFiles: {
				hook: "compilation",
				stage: "DERIVED",
				callback: this.bundle.bind(this)
			}
        });
    }


	/**
	 * @function
	 * @private
	 */
	bundle = () =>
	{
		const l = this.app.logger,
			  typesDir = existsSync(this.app.getSrcTypesPath()),
			  typesDirDist = existsSync(this.app.getRcPath("distTypes"));
		l.write("dts bundling", 1);
		l.value("   types directory", typesDir, 2);
		l.value("   is main tests", this.app.isMainTests, 3);
		l.value("   already bundled", this.app.global.tsCheck.typesBundled,3);
		if (!this.app.global.tsCheck.typesBundled && this.app.isMainTests && typesDir && typesDirDist)
		{
			const bundleCfg = {
				name: `${this.app.rc.pkgJson.name}-types`,
				baseDir: "types/dist",
				headerPath: "",
				headerText: "",
				main: "types/index.d.ts",
				out: "types.d.ts",
				outputAsModuleFolder: true,
				verbose: this.app.rc.log.level === 5
			};
			dts.bundle(bundleCfg);
			this.app.global.tsCheck.typesBundled = true;
			l.write("   dts bundle created successfully @ " + join(bundleCfg.baseDir, bundleCfg.out), 1);
		}
		else if (!typesDirDist) {
			l.warning("   types output directory doesn't exist, dts bundling skipped");
		}
		else if (!typesDir) {
			l.warning("   types directory doesn't exist, dts bundling skipped");
		}
		else {
			l.write("   dts bundling skipped", 1);
		}
	};


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilation} compilation
	 */
	async testsuite(compilation)
	{
		this.app.logger.write("build test suite", 1);
		this.onCompilation(compilation);

		const testsDir = join(this.app.getDistPath(), "test");

		const tsConfigFile = findTsConfig(this.app);
		if (!tsConfigFile)
		{
			const eMsg = "Could not locate tsconfig file for tests suite - must be **/tests?/tsconfig.* or **/tsconfig.tests?.json";
			this.handleError(new WebpackError(eMsg));
			this.logger.warning("consider possible solutions:");
			this.logger.warning("   (1) rename test suite config file according to convention");
			this.logger.warning("   (2) disable testsuite plugin in italic(.wsbuildrc.plugins.testsuite)");
			return;
		}

		this.app.logger.value("   found test suite tsconfig file", tsConfigFile, 2);

		if (!existsSync(testsDir))
		{
			this.app.logger.write("   checking for tsbuildinfo file path", 3);
			const tsConfig = getTsConfig(tsConfigFile);
			if (!tsConfig) {
				throw WpBuildError.getErrorMissing("tsconfig file", "exports/rules.js", this.app.wpc);
			}
			let buildInfoFile = tsConfig.json.compilerOptions.tsBuildInfoFile || join(dirname(tsConfigFile), "tsconfig.tsbuildinfo");
			if (!isAbsolute(buildInfoFile)) {
				buildInfoFile = resolve(dirname(tsConfigFile), buildInfoFile);
			}
			this.app.logger.value("   delete tsbuildinfo file", buildInfoFile, 3);
			try {
				await unlink(buildInfoFile);
			} catch {}
		}

		// await this.execTsBuild(relative(this.app.getRcPath("base"), tsConfigFile), 2, testsDir, true);
	}


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilationAssets} _assets
	 */
	async types(_assets)
	{
		const tsc = this.app.tsConfig;
		if (tsc)
		{
			const logger = this.logger,
				  basePath = this.app.getRcPath("base"),
			      typesDirSrc = this.app.getSrcTypesPath({ fstat: true }),
				  typesDirDist = this.app.getRcPath("distTypes");
			logger.write("build types");
			if (typesDirSrc && !existsSync(typesDirDist))
			{
				const tsbuildinfo = resolve(basePath, tsc.json.compilerOptions.tsBuildInfoFile ?? "tsconfig.tsbuildinfo");
				try { await unlink(tsbuildinfo); } catch {}
			}
			await this.execTsBuild(tsc, [
				 "./types", "--declaration", "--emitDeclarationsOnly", "--declarationDir", typesDirDist
			], 1, typesDirDist);
		}
	}


	/**
	 * @function Executes a typescript build using the specified tsconfig
	 * @private
	 * @param {typedefs.WpBuildAppTsConfig} tsc
	 * @param {string[]} args
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 */
	execTsBuild = async (tsc, args, identifier, outputDir, alias) =>
	{
		// const babel = [
		// 	"npx", "babel", tsConfig, "--out-dir", outputDir, "--extensions", ".ts",
		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
		// ];
		const logger = this.app.logger;
		let command = `npx tsc ${args.join(" ")}`;
		logger.write(`   execute typescript build @ italic(${tsc?.path})`, 1);

		let code = await this.exec(command, "tsc");
		if (code !== 0)
		{
			this.compilation.errors.push(new WebpackError("typescript build failed for " + tsc.path));
			return;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outputDir);
		}
		catch (e) {
			this.handleError(new WebpackError("typescript build failed for " + tsc.path), "output directory doesn't exist");
			return;
		}
		//
		// Run `tsc-alias` for path aliasing if specified.
		//
		if (alias)
		{   //
			// Note that `tsc-alias` requires a filename e.g. tsconfig.json in it's path argument
			//
			command = `tsc-alias -p ${tsc.path}`;
			code = await this.exec(command, "typescript path aliasing");
			if (code !== 0)
			{
				this.compilation.errors.push(new WebpackError("typescript path aliasing failed for " + tsc.path));
				return;
			}
		}
		//
		// Process output files
		//
		const files = await findFiles("**/*.js", { cwd: outputDir, absolute: true });
		for (const filePath of files)
		{
			let data, source, hash, newHash, cacheEntry, persistedCache;
			const filePathRel = relative(this.compiler.outputPath, filePath);

			logger.value("   process test suite output file", filePathRel, 3);
			logger.write("      check compilation cache for snapshot", 4);
			try {
				persistedCache = this.cache.get();
				cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
			}
			catch (e) {
				this.handleError(e, "failed while checking cache");
				return;
			}

			if (cacheEntry)
			{
				let isValidSnapshot;
				logger.write("      check snapshot valid", 4);
				try {
					isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
				}
				catch (e) {
					this.handleError(e, "failed while checking snapshot");
					return;
				}
				if (isValidSnapshot)
				{
					logger.write("      snapshot is valid", 4);
					({ hash, source } = cacheEntry);
					data = data || await readFile(filePath);
					newHash = newHash || this.getContentHash(data);
					if (newHash === hash)
					{
						logger.write("      asset is unchanged since last snapshot", 4);
					}
					else {
						logger.write("      asset has changed since last snapshot", 4);
					}
				}
				else {
					logger.write("      snapshot is invalid", 4);
				}
			}

			if (!source)
			{
				let snapshot;
				const startTime = Date.now();
				data = data || await readFile(filePath);
				source = new this.compiler.webpack.sources.RawSource(data);
				logger.write("      create snapshot", 4);
				try {
					snapshot = await this.createSnapshot(startTime, filePath);
				}
				catch (e) {
					this.handleError(e, "failed while creating snapshot for " + filePathRel);
					return;
				}
				if (snapshot)
				{
					logger.write("      cache snapshot", 4);
					try {
						newHash = newHash || this.getContentHash(source.buffer());
						snapshot.setFileHashes(hash);
						await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot, hash });
						cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
					}
					catch (e) {
						this.handleError(e, "failed while caching snapshot " + filePathRel);
						return;
					}
				}
			}

			data = data || await readFile(filePath);
			newHash = newHash || this.getContentHash(data);
			if (newHash === persistedCache[filePathRel])
			{
				logger.write("      asset is unchanged", 4);
			}
			else {
				logger.write("      asset has changed, update hash in persistent cache", 4);
				persistedCache[filePathRel] = newHash;
				this.cache.set(persistedCache);
			}

			const info = /** @type {WebpackAssetInfo} */({
				contenthash: newHash,
				development: true,
				immutable: newHash === persistedCache[filePathRel],
				javascriptModule: false,
				tests: true
			});

			// this.compilation.additionalChunkAssets.push(filePathRel);

			const existingAsset = this.compilation.getAsset(filePathRel);
			if (!existingAsset)
			{
				logger.write("      emit asset", 3);
				this.compilation.emitAsset(filePathRel, source, info);
			}
			else if (this.options.force)
			{
				logger.write("      update asset", 3);
				this.compilation.updateAsset(filePathRel, source, info);
			}
			else {
				logger.write("      asset compared for emit", 3);
				this.compilation.buildDependencies.add(filePathRel);
				this.compilation.comparedForEmitAssets.add(filePathRel);
				this.compilation.compilationDependencies.add(filePathRel);
			}
		}

		logger.write(`   finished execution of typescript build @ italic(${tsc.path})`, 3);
	};

}


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildTscPlugin | undefined}
 */
const testsuite = (app) =>
	app.isTests || app.build.type === "webapp" ? new WpBuildTscPlugin({ app }) : undefined;


module.exports = testsuite;

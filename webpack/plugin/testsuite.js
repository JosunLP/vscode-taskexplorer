/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/testsuite.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman
 */

const { existsSync } = require("fs");
const { promisify } = require("util");
const WpBuildBasePlugin = require("./base");
const { WebpackError } = require("webpack");
const exec = promisify(require("child_process").exec);
const { findFiles, getTsConfig } = require("../utils");
const {readFile, unlink, access } = require("fs/promises");
const { join, basename, relative, dirname, isAbsolute, resolve } = require("path");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WebpackCompilationParams} WebpackCompilationParams */


class WpBuildTestSuitePlugin extends WpBuildBasePlugin
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
			buildTestsSuite: {
				async: true,
                hook: "afterCompile",
                // hook: "compilation",
				// stage: "ADDITIONAL",
				statsProperty: "tests",
                callback: this.testsuite.bind(this)
            }
        });
    }


	/**
	 * @function
	 * @private
	 * @param {WebpackCompilation} compilation
	 */
	async testsuite(compilation)
	{
		this.env.logger.write("build test suite", 1);
		this.onCompilation(compilation);

		const testsDir = join(this.env.paths.dist, "test");
		const globOptions = {
			cwd: this.env.paths.build,
			absolute: true,
			ignore: [ "**/node_modules/**", "**/.vscode*/**", "**/build/**", "**/dist/**", "**/res*/**", "**/doc*/**" ]
		};

		let tsConfigFile,
			files = await findFiles("**/src/**/test{,s}/tsconfig.*", globOptions);
		if (files.length === 0)
		{
			files = await findFiles("**/src/**tsconfig.test{,s}.*", globOptions);
		}
		if (files.length >= 1)
		{
			tsConfigFile = files[0];
		}

		if (!tsConfigFile)
		{
			const eMsg = "Could not locate tsconfig file for tests suite - must be **/tests?/tsconfig.* or **/tsconfig.tests?.json";
			this.handleError(new WebpackError(eMsg));
			this.logger.warning("consider possible solutions:");
			this.logger.warning("   (1) rename test suite config file according to convention");
			this.logger.warning("   (2) disable testsuite plugin in italic(.wsbuildrc.plugins.testsuite)");
			return;
		}

		this.env.logger.value("   found test suite tsconfig file", tsConfigFile, 2);

		if (!existsSync(testsDir))
		{
			this.env.logger.write("   checking for tsbuildinfo file path", 3);
			const tsConfig = getTsConfig(this.env, tsConfigFile);
			let buildInfoFile = tsConfig.compilerOptions.tsBuildInfoFile || join(dirname(tsConfigFile), "tsconfig.tsbuildinfo");
			if (!isAbsolute(buildInfoFile)) {
				buildInfoFile = resolve(dirname(tsConfigFile), buildInfoFile);
			}
			this.env.logger.value("   delete tsbuildinfo file", buildInfoFile, 3);
			try {
				await unlink(buildInfoFile);
			} catch {}
		}

		await this.execTsBuild(relative(this.env.paths.build, tsConfigFile), 2, testsDir, true);
	}


	// /**
	//  * @function
	//  * @private
	//  * @param {WebpackCompilationAssets} _assets
	//  */
	// async types(_assets)
	// {
	// 	const bldDir = this.env.paths.build,
	// 		  typesDir = join(bldDir, "types", "dist");
	// 	this.env.logger.write("build types");
	// 	if (!existsSync(typesDir))
	// 	{
	// 		try { await unlink(join(bldDir, "node_modules", ".cache", "tsconfig.types.tsbuildinfo")); } catch {}
	// 	}
	// 	await this.execTsBuild("./types", 1, typesDir);
	// }


	/**
	 * @function Executes a command via a promisified node exec()
	 * @private
	 * @param {string} command
	 * @param {string} dsc
	 * @returns {Promise<number | null>}
	 */
	exec = async (command, dsc) =>
	{
		let exitCode = null,
			stdout = "", stderr = "";
		const logger = this.env.logger,
			  procPromise = exec(command, { cwd: this.env.paths.build, encoding: "utf8" }),
			  child = procPromise.child;
		child.stdout?.on("data", (data) => { stdout += data; });
		child.stderr?.on("data", (data) => { stderr += data; });
		child.on("close", (code) => { exitCode = code; logger.write(`   ${dsc} completed with exit code bold(${code})`); });
		await procPromise;
		if (stdout || stderr)
		{
			const match = (stdout || stderr).match(/error TS([0-9]{4})\:/);
			if (match) {
				const [ _, err ] = match;
				logger.error(`   tsc failed with error: ${err}`);
			}
			if (stdout) {
				logger.write(`   tsc stderr: ${stdout}`, 5, "", logger.icons.color.star, logger.colors.yellow);
			}
			if (stderr) {
				logger.write(`   tsc stderr: ${stderr}`, 5, "", logger.icons.color.star, logger.colors.yellow);
			}
		}
		return exitCode;
	};


	/**
	 * @function Executes a typescript build using the specified tsconfig
	 * @private
	 * @param {string} tsConfigFile Path to tsconfig file or dir, relative to `env.paths.build`
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 */
	execTsBuild = async (tsConfigFile, identifier, outputDir, alias) =>
	{
		// const babel = [
		// 	"npx", "babel", tsConfig, "--out-dir", outputDir, "--extensions", ".ts",
		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
		// ];
		const logger = this.env.logger;
		let command = `npx tsc -p ${tsConfigFile}`; // babel.join(" ");
		logger.write(`   execute typescript build @ italic(${tsConfigFile})`, 1);

		let code = await this.exec(command, "typescript build");
		if (code !== 0)
		{
			this.compilation.errors.push(new WebpackError("typescript build failed for " + tsConfigFile));
			return;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outputDir);
		}
		catch (e) {
			this.handleError(new WebpackError("typescript build failed for " + tsConfigFile), "output directory doesn't exist");
			return;
		}
		//
		// Run `tsc-alias` for path aliasing if specified.
		//
		if (alias)
		{   //
			// Note that `tsc-alias` requires a filename e.g. tsconfig.json in it's path argument
			//
			if (!(/tsconfig\.(?:[\w\-_\.]+\.)?json$/).test(tsConfigFile))
			{
				tsConfigFile = join(tsConfigFile, "tsconfig.json");
			}
			if (!existsSync(tsConfigFile))
			{
				const files = await findFiles("tsconfig.*", { cwd: dirname(tsConfigFile), absolute: true,  });
				if (files.length === 1)
				{
					tsConfigFile = files[0];
				}
				else {
					this.handleError(new WebpackError("Invalid path to tsconfig file"));
					return;
				}
			}
			command = `tsc-alias -p ${tsConfigFile}`;
			code = await this.exec(command, "typescript path aliasing");
			if (code !== 0)
			{
				this.compilation.errors.push(new WebpackError("typescript path aliasing failed for " + tsConfigFile));
				return;
			}
		}
		//
		// Process output files
		//
		// const files = await findFiles("**/*.js", { cwd: outputDir, absolute: true });
		// for (const filePath of files)
		// {
		// 	let data, /* source, hash, compilationCacheEntry, */persistedCache;
		// 	const filePathRel = relative(outputDir, filePath),
		// 		  file = basename(filePathRel);

		// 	// this.compilation.buildDependencies.add(file);

		// 	logger.value("   check cache", filePathRel, 4);
		// 	try {
		// 		persistedCache = this.cache.get();
		// 		// compilationCacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
		// 	}
		// 	catch (e) {
		// 		this.handleError(e, "failed while checking cache");
		// 		return;
		// 	}

		// 	if (persistedCache)
		// 	{
		// 		data = data || await readFile(filePath);
		// 		const newHash = this.getContentHash(data);
		// 		if (newHash === persistedCache[filePathRel])
		// 		{
		// 			logger.value("   asset unchanged", filePathRel, 4);
		// 			// this.compilation.comparedForEmitAssets.add(file);
		// 			continue;
		// 		}
		// 		persistedCache[filePathRel] = newHash;
		// 		this.cache.set(persistedCache);
		// 	}

		// 	// if (compilationCacheEntry)
		// 	// {
		// 	// 	let isValidSnapshot;
		// 	// 	logger.value("   check snapshot valid", filePathRel, 3);
		// 	// 	try {
		// 	// 		isValidSnapshot = await this.checkSnapshotValid(compilationCacheEntry.snapshot);
		// 	// 	}
		// 	// 	catch (e) {
		// 	// 		this.handleError(e, "failed while checking snapshot");
		// 	// 		return;
		// 	// 	}
		// 	// 	if (isValidSnapshot)
		// 	// 	{
		// 	// 		logger.value("   snapshot valid", filePathRel, 4);
		// 	// 		({ hash, source } = compilationCacheEntry);
		// 	// 		data = data || await readFile(filePath);
		// 	// 		const newHash = this.getContentHash(data);
		// 	// 		if (newHash === hash)
		// 	// 		{
		// 	// 			logger.value("   asset unchanged", filePathRel, 4);
		// 	// 			this.compilation.comparedForEmitAssets.add(file);
		// 	// 			return;
		// 	// 		}
		// 	// 	}
		// 	// 	else {
		// 	// 		logger.write(`   snapshot for '${filePathRel}' is invalid`, 4);
		// 	// 	}
		// 	// }

		// 	// if (!source)
		// 	// {
		// 	// 	let snapshot;
		// 	// 	const startTime = Date.now();
		// 	// 	data = data || await readFile(filePath);
		// 	// 	source = new this.compiler.webpack.sources.RawSource(data);
		// 	// 	logger.value("   create snapshot", filePathRel, 4);
		// 	// 	try {
		// 	// 		snapshot = await this.createSnapshot(startTime, filePath);
		// 	// 	}
		// 	// 	catch (e) {
		// 	// 		this.handleError(e, "failed while creating snapshot");
		// 	// 		return;
		// 	// 	}
		// 	// 	if (snapshot)
		// 	// 	{
		// 	// 		// console.log("########: ");
		// 	// 		// console.log("hasContextHashes: " + snapshot.hasContextHashes());
		// 	// 		// console.log("hasFileHashes: " + snapshot.hasFileHashes());
		// 	// 		// console.log("hasFileTimestamps: " + snapshot.hasFileTimestamps());
		// 	// 		// console.log("hasStartTime: " + snapshot.hasStartTime());

		// 	// 		logger.value("   cache snapshot", filePathRel, 4);
		// 	// 		try {
		// 	// 			const hash = this.getContentHash(source.buffer());
		// 	// 			snapshot.setFileHashes(hash);
		// 	// 			await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot, hash });

		// 	// 			compilationCacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
		// 	// 			// if (cacheEntry)
		// 	// 			// {
		// 	// 			// 	console.log("!!!!!!!!!!: " + cacheEntry.hash);
		// 	// 			// 	console.log("hasContextHashes: " + snapshot.hasContextHashes());
		// 	// 			// 	console.log("hasFileHashes: " + snapshot.hasFileHashes());
		// 	// 			// 	console.log("hasFileTimestamps: " + snapshot.hasFileTimestamps());
		// 	// 			// 	console.log("hasStartTime: " + snapshot.hasStartTime());
		// 	// 			// }
		// 	// 		}
		// 	// 		catch (e) {
		// 	// 			this.handleError(e, "failed while caching snapshot");
		// 	// 			return;
		// 	// 		}
		// 	// 	}
		// 	// }

		// 	// const info = {
		// 	// 	absoluteFilename: filePath,
		// 	// 	sourceFilename: filePathRel,
		// 	// 	filename: file,
		// 	// 	precompile: true,
		// 	// 	development: true,
		// 	// 	immutable: true
		// 	// };

		// 	// const existingAsset = this.compilation.getAsset(filePathRel);
		// 	// if (!existingAsset)
		// 	// {
		// 	// 	logger.value("   add asset", filePathRel, 2);
		// 	// 	// this.compilation.additionalChunkAssets.push(filePathRel);
		// 	// 	// logger.value("   emit asset", filePathRel, 2);
		// 	// 	// this.compilation.emitAsset(file, source, info);
		// 	// }
		// 	// else if (this.options.force) {
		// 	// 	logger.value("   update asset", filePathRel, 2);
		// 	// 	this.compilation.updateAsset(file, source, info);
		// 	// }

		// 	// this.compilation.comparedForEmitAssets.add(filePathRel);
		// }
	};

}


/**
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildTestSuitePlugin | undefined}
 */
const testsuite = (env) =>
	env.isTests && env.app.plugins.build && env.build !== "webview" ? new WpBuildTestSuitePlugin({ env }) : undefined;


module.exports = testsuite;

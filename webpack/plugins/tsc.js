/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { relative, dirname, join } = require("path");
const WpBuildPlugin = require("./base");
const { access, readFile } = require("fs/promises");
const { findFiles } = require("../utils");
const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const { existsSync } = require("fs");


/**
 * @class WpBuildTscPlugin
 * @abstract
 */
class WpBuildTscPlugin extends WpBuildPlugin
{
	/**
	 * @function Executes a typescript build using the specified tsconfig
	 * @protected
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

		// 	logger.value("   process test suite output file", filePathRel, 3);
		// 	logger.write("      check compilation cache for snapshot", 4);
		// 	try {
		// 		persistedCache = this.cache.get();
		// 		cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
		// 	}
		// 	catch (e) {
		// 		this.handleError(e, "failed while checking cache");
		// 		return;
		// 	}

		// 	if (cacheEntry)
		// 	{
		// 		let isValidSnapshot;
		// 		logger.write("      check snapshot valid", 4);
		// 		try {
		// 			isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
		// 		}
		// 		catch (e) {
		// 			this.handleError(e, "failed while checking snapshot");
		// 			return;
		// 		}
		// 		if (isValidSnapshot)
		// 		{
		// 			logger.write("      snapshot is valid", 4);
		// 			({ hash, source } = cacheEntry);
		// 			data = data || await readFile(filePath);
		// 			newHash = newHash || this.getContentHash(data);
		// 			if (newHash === hash)
		// 			{
		// 				logger.write("      asset is unchanged since last snapshot", 4);
		// 			}
		// 			else {
		// 				logger.write("      asset has changed since last snapshot", 4);
		// 			}
		// 		}
		// 		else {
		// 			logger.write("      snapshot is invalid", 4);
		// 		}
		// 	}

		// 	if (!source)
		// 	{
		// 		let snapshot;
		// 		const startTime = Date.now();
		// 		data = data || await readFile(filePath);
		// 		source = new this.compiler.webpack.sources.RawSource(data);
		// 		logger.write("      create snapshot", 4);
		// 		try {
		// 			snapshot = await this.createSnapshot(startTime, filePath);
		// 		}
		// 		catch (e) {
		// 			this.handleError(e, "failed while creating snapshot for " + filePathRel);
		// 			return;
		// 		}
		// 		if (snapshot)
		// 		{
		// 			logger.write("      cache snapshot", 4);
		// 			try {
		// 				newHash = newHash || this.getContentHash(source.buffer());
		// 				snapshot.setFileHashes(hash);
		// 				await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot, hash });
		// 				cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
		// 			}
		// 			catch (e) {
		// 				this.handleError(e, "failed while caching snapshot " + filePathRel);
		// 				return;
		// 			}
		// 		}
		// 	}

		// 	data = data || await readFile(filePath);
		// 	newHash = newHash || this.getContentHash(data);
		// 	if (newHash === persistedCache[filePathRel])
		// 	{
		// 		logger.write("      asset is unchanged", 4);
		// 	}
		// 	else {
		// 		logger.write("      asset has changed, update hash in persistent cache", 4);
		// 		persistedCache[filePathRel] = newHash;
		// 		this.cache.set(persistedCache);
		// 	}

		const info = /** @type {typedefs.WebpackAssetInfo} */({
			// contenthash: newHash,
			development: true,
			immutable: true, // newHash === persistedCache[filePathRel],
			javascriptModule: false,
			types: true
		});
		this.compilation.buildDependencies.add(filePathRel);
		// this.compilation.emitAsset(filePathRel, source, info);

		// 	// this.compilation.additionalChunkAssets.push(filePathRel);

		// 	const existingAsset = this.compilation.getAsset(filePathRel);
		// 	if (!existingAsset)
		// 	{
		// 		logger.write("      emit asset", 3);
		// 		this.compilation.emitAsset(filePathRel, source, info);
		// 	}
		// 	else if (this.options.force)
		// 	{
		// 		logger.write("      update asset", 3);
		// 		this.compilation.updateAsset(filePathRel, source, info);
		// 	}
		// 	else {
		// 		logger.write("      asset compared for emit", 3);
		// 		this.compilation.buildDependencies.add(filePathRel);
		// 		this.compilation.comparedForEmitAssets.add(filePathRel);
		// 		this.compilation.compilationDependencies.add(filePathRel);
		// 	}
		}

		logger.write(`   finished execution of typescript build @ italic(${tsc.path})`, 3);
	};


	/**
	 * @function Executes a typescript build using the specified tsconfig
	 * @protected
	 * @param {string} tsConfigFile Path to tsconfig file or dir, relative to `app.paths.build`
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 */
	execTsBuild2 = async (tsConfigFile, identifier, outputDir, alias) =>
	{
		// const babel = [
		// 	"npx", "babel", tsConfig, "--out-dir", outputDir, "--extensions", ".ts",
		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
		// ];
		const logger = this.app.logger;
		let command = `npx tsc -p ${tsConfigFile}`; // babel.join(" ");
		logger.write(`   execute typescript build @ italic(${tsConfigFile})`, 1);

		let code = await this.exec(command, "tsc");
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
				const files = await findFiles("tsconfig.*", { cwd: dirname(tsConfigFile), absolute: true });
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

			const info = /** @type {typedefs.WebpackAssetInfo} */({
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

		logger.write(`   finished execution of typescript build @ italic(${tsConfigFile})`, 3);
	};

}


module.exports = WpBuildTscPlugin;

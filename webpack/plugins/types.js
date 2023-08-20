/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const dts = require("dts-bundle");
const { existsSync } = require("fs");
const { unlink } = require("fs/promises");
const { join, resolve } = require("path");
const WpBuildTscPlugin = require("./tsc");
const typedefs = require("../types/typedefs");


/**
 * @class WpBuildTypesPlugin
 */
class WpBuildTypesPlugin extends WpBuildTscPlugin
{
    /**
     * @class WpBuildTypesPlugin
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
		super(options, "types");
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
			buildTypes: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: "types",
				statsPropertyColor: this.app.build.log.color || "blue",
                callback: this.types.bind(this)
            }
        });
    }


	/**
	 * @function
	 * @private
	 * @param {typedefs.WebpackCompilationAssets} _assets
	 */
	async types(_assets)
	{
		const tsc = this.app.tsConfig;
		if (tsc)
		{
			const logger = this.logger,
				  basePath = /** @type {string} */(this.app.getRcPath("base")),
			      typesDirSrc = this.app.getSrcPath({ build: this.app.build.name, stat: true }),
				  typesDirDist = this.app.getDistPath({ build: this.app.build.name });
			logger.write("start types build", 2);
			logger.value("   base path", basePath, 3);
			logger.value("   types src path", typesDirSrc, 3);
			logger.value("   types dist path", typesDirDist, 3);
			if (typesDirSrc)
			{
				if (typesDirSrc && !existsSync(typesDirDist))
				{
					logger.write("   force clean tsbuildinfo file", 2);
					const tsbuildinfo = resolve(basePath, tsc.json.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo");
					try { await unlink(tsbuildinfo); } catch {}
				}
				await this.execTsBuild(tsc, [
					"-p", "./tsconfig.node.json", "--declaration", "--emitDeclarationOnly", "--declarationDir", typesDirDist
				], 1, typesDirDist);
				this.typesBundleDts();
				logger.write("type definitions created successfully @ " + typesDirDist, 1);
			}
		}
	}


	/**
	 * @function
	 * @private
	 */
	typesBundleDts = () =>
	{
		const l = this.app.logger,
			  typesDirSrc = this.app.getSrcPath({ build: this.app.build.name, stat: true }),
			  typesDirDist = /** @type {string} */(this.app.getDistPath({ build: this.app.build.name }));
		l.write("start bundle dts", 1);
		l.value("   types directory", typesDirSrc, 2);
		l.value("   is main tests", this.app.isMainTests, 3);
		l.value("   already bundled", this.app.global.tsc.typesBundled,3);
		if (!this.app.global.tsc.typesBundled && typesDirSrc && typesDirDist)
		{
			const bundleCfg = {
				name: `${this.app.pkgJson.name}-types`,
				baseDir: "types/dist",
				headerPath: "",
				headerText: "",
				main: "types/build/interface/index.d.ts",
				out: "types.d.ts",
				outputAsModuleFolder: true,
				verbose: this.app.build.log.level === 5
			};
			dts.bundle(bundleCfg);
			this.app.global.tsc.typesBundled = true;
			l.write("dts bundle created successfully @ " + join(bundleCfg.baseDir, bundleCfg.out), 1);
		}
		else if (!typesDirDist) {
			l.warning("types output directory doesn't exist, dts bundling skipped");
		}
		else if (!typesDirSrc) {
			l.warning("types source directory doesn't exist, dts bundling skipped");
		}
		else {
			l.write("dts bundling skipped", 1);
		}
	};

}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTypesPlugin | undefined}
 */
const types = (app) => undefined;
	// app.isTests || app.build.type === "webapp" && app.build.plugins.testsuite ? ? new WpBuildTscPlugin({ app }) : undefined;


module.exports = types;

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
				statsPropertyColor: this.app.rc.log.color || "blue",
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
				  basePath = this.app.getRcPath("base"),
			      typesDirSrc = this.app.getSrcTypesPath({ fstat: true }),
				  typesDirDist = this.app.getRcPath("distTypes");
			logger.write("verify tsconfig file", 2);
			logger.value("   base path", basePath, 3);
			logger.value("   types src path", typesDirSrc, 3);
			logger.value("   types dist path", typesDirDist, 3);
			if (typesDirSrc && !existsSync(typesDirDist))
			{
				logger.write("force clean tsbuildinfo file", 2);
				const tsbuildinfo = resolve(basePath, tsc.json.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo");
				try { await unlink(tsbuildinfo); } catch {}
			}
			logger.write("build types", 2);
			await this.execTsBuild(tsc, [
				"-p", "./tsconfig.node.json", "--declaration", "--emitDeclarationOnly", "--declarationDir", typesDirDist
			], 1, typesDirDist);
			this.typesBundleDts();
		}
	}


	/**
	 * @function
	 * @private
	 */
	typesBundleDts = () =>
	{
		const l = this.app.logger,
			  typesDir = existsSync(this.app.getSrcTypesPath()),
			  typesDirDist = existsSync(this.app.getRcPath("distTypes"));
		l.write("start bundle dts", 1);
		l.value("   types directory", typesDir, 2);
		l.value("   is main tests", this.app.isMainTests, 3);
		l.value("   already bundled", this.app.global.tsc.typesBundled,3);
		if (!this.app.global.tsc.typesBundled && this.app.isMainTests && typesDir && typesDirDist)
		{
			const bundleCfg = {
				name: `${this.app.rc.pkgJson.name}-types`,
				baseDir: "types/dist",
				headerPath: "",
				headerText: "",
				main: "types/build/interface/index.d.ts",
				out: "types.d.ts",
				outputAsModuleFolder: true,
				verbose: this.app.rc.log.level === 5
			};
			dts.bundle(bundleCfg);
			this.app.global.tsc.typesBundled = true;
			l.write("dts bundle created successfully @ " + join(bundleCfg.baseDir, bundleCfg.out), 1);
		}
		else if (!typesDirDist) {
			l.warning("types output directory doesn't exist, dts bundling skipped");
		}
		else if (!typesDir) {
			l.warning("types directory doesn't exist, dts bundling skipped");
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
	// app.isTests || app.build.type === "webapp" && app.rc.plugins.testsuite ? ? new WpBuildTscPlugin({ app }) : undefined;


module.exports = types;

/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildBaseTsPlugin = require("./tsc");
const typedefs = require("../types/typedefs");


/**
 * @class WpBuildTsBundlePlugin
 */
class WpBuildTsBundlePlugin extends WpBuildBaseTsPlugin
{
    /**
     * @class WpBuildTsBundlePlugin
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
		super(options, "tsbundle");
    }

    /**
     * Called by webpack runtime to initialize this plugin
     *
     * @function
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		if (this.app.args.build === this.app.build.name)
		{
			this.onApply(compiler,
			{
				bundleDtsFiles: {
					hook: "compilation",
					stage: "DERIVED",
					statsProperty: "tsbundle",
					statsPropertyColor: this.app.build.log.color,
					callback: this.bundleDts.bind(this)
				}
			});
		}
        else
		{
			this.onApply(compiler,
			{
				bundleDtsFiles: {
					hook: "afterEmit",
					statsProperty: "tsbundle",
					statsPropertyColor: this.app.build.log.color,
					callback: this.bundleDts.bind(this)
				}
			});
		}
    }

}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTsBundlePlugin | undefined}
 */
const tsbundle = (app) => app.build.bundleDts ? new WpBuildTsBundlePlugin({ app }) : undefined;


module.exports = tsbundle;

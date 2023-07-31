/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module WpBuildBasePlugin
 */

const { merge } = require("../utils");
const { ModuleFilenameHelpers } = require("webpack");

/** @typedef {import("../types").WebpackLogger} WebpackLogger */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCacheFacade} WebpackCacheFacade */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildHashPlugin
 */
class WpBuildBasePlugin
{
    /**
     * @protected
     * @type {WebpackCacheFacade}
     */
    cache;

    /**
     * @protected
     * @type {WebpackCompilation}
     */
    compilation;

    /**
     * @protected
     * @type {WebpackCompiler}
     */
    compiler;

    /**
     * @protected
     * @type {WebpackLogger}
     */
    logger;

    /**
     * @protected
     * @type {(str: string) => boolean}
     */
    matchObject;

    /**
     * @protected
     * @type {WpBuildPluginOptions}
     */
    options;

    /**
     * @class
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        this.options = /** @type {WpBuildPluginOptions} */(merge({}, options));
		    this.matchObject = ModuleFilenameHelpers.matchObject.bind(undefined, this.options);
    }

    /**
     * @function Called by webpack runtime to apply this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    onApply(compiler)
    {
		this.compiler = compiler;
    }

    /**
     * @param {string} name
     * @param {WebpackCompilation} compilation
     */
    onCompilation(name, compilation)
    {
        this.compilation = compilation;
        this.cache = /** @type {WebpackCacheFacade} */(compilation.getCache(name));
        this.logger = /** @type {WebpackLogger} */(compilation.getLogger(name));
    }

}


module.exports = WpBuildBasePlugin;

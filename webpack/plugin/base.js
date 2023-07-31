/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module WpBuildBasePlugin
 */

const { merge } = require("../utils");
const { ModuleFilenameHelpers } = require("webpack");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildHashPlugin
 */
class WpBuildBasePlugin
{
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
    apply(compiler)
    {
		this.compiler = compiler;
    }

}


module.exports = WpBuildBasePlugin;

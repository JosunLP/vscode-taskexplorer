/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.licensefiles
 */

const { join } = require("path");
const { existsSync } = require("fs");
const WpBuildBasePlugin = require("./base");
const { rename, unlink, readdir } = require("fs/promises");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildLicenseFilePlugin
 */
class WpBuildDisposePlugin extends WpBuildBasePlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            checkin: {
                async: true,
                hook: "shutdown",
                callback: this.dispose.bind(this)
            }
        });
    }

    async dispose()
    {
        this.logger.write("cleanup: call all registered disposables", 2);
        for (const d of this.env.disposables.splice(0)) {
            await d.dispose();
        }
    }
}


/**
 * @function
 * @param {WpBuildEnvironment} env
 * @returns {WpBuildDisposePlugin}
 */
const dispose = (env) => new WpBuildDisposePlugin({ env });


module.exports = dispose;

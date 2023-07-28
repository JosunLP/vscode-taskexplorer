/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.compile
 */

const { readdirSync, copyFileSync } = require("fs");
const { join, resolve } = require("path");
const { Compiler, Compilation, sources } =  require("webpack");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function beforeemit
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const compile = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.compilation.tap("CompileThisCompilationPlugin", (compilation) =>
                {
                    const logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
                    const cache = compilation.getCache("CompileThisCompilationPlugin");
                    // if (env.environment !== "prod" && env.buildMode === "debug")
                    // {
                    // }

                    compilation.hooks.processAssets.tap(
                    {
                        name: "CompileProcessAssetsCompilationPlugin",
                        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
                    },
                    (assets) =>
                    {
                        Object.entries(assets).forEach(a =>
                        {
                            const asset = /** @type {Readonly<import("webpack").Asset>} */(compilation.getAsset(a[0])),
                                source = a[1],
                                content= source.source().toString(),
                                regex = /\n[ \t]*module\.exports \= require\(/gm,
                                newContent = content.replace(regex, (v) => "/* istanbul ignore next */" + v);
                            compilation.updateAsset(a[0], new sources.RawSource(newContent), { ...asset.info, ...{ contenthash: "GGGG" } });
                        });

                        if (compilation.hooks.statsPrinter)
                        {
                            compilation.hooks.statsPrinter.tap("CompileThisCompilationPlugin", (stats) =>
                            {
                                stats.hooks.print.for("asset.info.copied").tap(
                                    "CompileProcessAssetsCompilationPlugin",
                                    (copied, { green, formatFlag }) => {
                                        return copied ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)("copied")) : ""
                                    }
                                );
                            });
                        }
                    });
                });
            }
        };
    }
    return plugin;
};


/**
 * @function _upload
 * @param {WebpackStatsAsset[]} assets
 * @param {WebpackEnvironment} env
 */
const dupHashFile= (assets, env) =>
{
    const teModule = assets.find(a => a.startsWith("taskexplorer") && a.endsWith(".js"));
    if (teModule) {
        copyFileSync(join(env.paths.dist, teModule.name), join(env.paths.dist, "taskexplorer.js"));
    }
};


module.exports = compile;

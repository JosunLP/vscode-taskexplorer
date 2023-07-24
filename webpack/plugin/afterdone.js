/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.afterdone
 */

const { join, resolve } = require("path");
const { spawnSync } = require("child_process");
const { writeInfo, figures } = require("../console");
const { renameSync, existsSync, writeFileSync, readFileSync, copyFileSync, unlinkSync } = require("fs");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method afterdone
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const afterdone = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        const _env = { ...env };
        plugin =
        {   /** @param {import("webpack").Compiler} compiler Compiler */
            apply: (compiler) =>
            {
                compiler.hooks.afterDone.tap("AfterDonePlugin", () =>
                {
                    licenseFiles(_env);
                    if (_env.environment === "test") {
                        istanbulFileTags(_env);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @method istanbulFileTags
 * @param {WebpackEnvironment} env
 */
const istanbulFileTags = (env) =>
{
    //
    // TODO - See we can move his and hook into afterEmit and replace content before emitted to outpout dir
    //

    const outFile = join(env.paths.build, "dist", "taskexplorer.js");
    if (existsSync(outFile))
    {
        const regex = /\n[ \t]*module\.exports \= require\(/mg,
                content = readFileSync(outFile, "utf8"),
                newContent = content.replace(regex, (v) => "/* istanbul ignore next */" + v);
        try {
            writeFileSync(outFile, newContent);
        } catch {}
        if (content.includes("/* istanbul ignore file */")) {
            writeInfo("The '/* istanbul ignore file */ ' tag was found and will break coverage", figures.error);
        }
    }
};


/**
 * @method licenseFiles
 * @param {WebpackEnvironment} env
 */
const licenseFiles = (env) =>
{
    try { renameSync(join(env.paths.dist, "vendor.js.LICENSE.txt"), join(env.paths.dist, "vendor.LICENSE")); } catch {}
    try { renameSync(join(env.paths.dist, "taskexplorer.js.LICENSE.txt"), join(env.paths.dist, "taskexplorer.LICENSE")); } catch {}
    try { unlinkSync(join(env.paths.temp, "taskexplorer.debug.js.LICENSE.txt")); } catch {}
    try { unlinkSync(join(env.paths.temp, "vendor.debug.js.LICENSE.txt")); } catch {}
};


module.exports = afterdone;

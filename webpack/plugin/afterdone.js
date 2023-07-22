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

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */


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
    const outFile = join(env.buildPath, "dist", "taskexplorer.js");
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
 * Uses 'plink' and 'pscp' from PuTTY package: https://www.putty.org/
 * @param {WebpackEnvironment} env
 */
const licenseFiles = (env) =>
{
    try {
        renameSync(join(env.distPath, "vendor.js.LICENSE.txt"), join(env.distPath, env.app, env.environment, "vendor.LICENSE"));
        renameSync(join(env.distPath, "taskexplorer.js.LICENSE.txt"), join(env.distPath, env.app, env.environment, "taskexplorer.LICENSE"));
        unlinkSync(join(env.tempPath, env.app, env.environment, "taskexplorer.debug.js.LICENSE.txt"));
        unlinkSync(join(env.tempPath, env.app, env.environment, "vendor.debug.js.LICENSE.txt"));
    } catch {}
};


module.exports = afterdone;

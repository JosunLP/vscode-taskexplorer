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
                    sourceMapFiles(_env);
                    if (_env.environment === "test") {
                        istanbulFileTags(_env);
                    }
                    upload(_env);
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
 * @method sourceMapFiles
 * @param {WebpackEnvironment} env
 */
const sourceMapFiles = (env) =>
{
    const distPath = join(env.buildPath, "dist");
    try {
        renameSync(join(distPath, "taskexplorer.js.map"), join(env.tempPath, env.app, env.environment, "taskexplorer.js.map"));
        copyFileSync(join(env.buildPath, "node_modules", "source-map", "lib", "mappings.wasm"), join(env.tempPath, "shared", "mappings.wasm"));
    } catch {}
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


/**
 * @method upload
 * Uses 'plink' and 'pscp' from PuTTY package: https://www.putty.org/
 * @param {WebpackEnvironment} env
 */
const upload = (env) =>
{
    const user = "smeesseman",
          host = "app1.spmeesseman.com",
          rBasePath = "/var/www/app1/res/app",
          /** @type {import("child_process").SpawnSyncOptions} */
          spawnSyncOpts = { cwd: env.buildPath, encoding: "utf8", shell: true },
          lBasePath = resolve(process.env.TEMP || process.env.TMP  || ".", env.app, env.environment),
          sshAuth = process.env.SPMEESSEMAN_COM_APP1_SSH_AUTH_SMEESSEMAN || "InvalidAuth";
    const plinkArgs = [
        "-ssh",   // force use of ssh protocol
        "-batch", // disable all interactive prompts
        "-pw",    // authenticate
        sshAuth,  // auth key
        `${user}@${host}`,
        `"mkdir ${rBasePath}/${env.app}/v${env.version}/${env.environment}"`
    ];
    const pscpArgs = [
        "-pw",   // authenticate
        sshAuth, // auth key
        // "-q", // quiet, don't show statistics
        "-r", // copy directories recursively
        join(lBasePath, env.app, env.environment),
        `${user}@${host}:"${rBasePath}/${env.app}/,lv${env.version}/${env.environment}"`
    ];
    console.log(`plink ${plinkArgs.join(" ")}`);
    console.log(`pscp ${pscpArgs.join(" ")}`);
    // spawnSync("plink", plinkArgs, spawnSyncOpts);
    // spawnSync("pscp", pscpArgs, spawnSyncOpts);
};


module.exports = afterdone;

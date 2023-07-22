/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.upload
 */

const { join } = require("path");
const { writeInfo } = require("../console");
const { spawnSync } = require("child_process");
const { renameSync, copyFileSync } = require("fs");

/** @typedef {import("../types/webpack").WebpackConfig} WebpackConfig */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method upload
 * Uses 'plink' and 'pscp' from PuTTY package: https://www.putty.org
 * !!! For first time build on fresh os install:
 * !!!   - create the environment variable SPMEESSEMAN_COM_APP1_SSH_AUTH_SMEESSEMAN
 * !!!   - run a plink command manually to generate and trust the fingerprints:
 * !!!       plink -ssh -batch -pw <PWD> smeesseman@app1.spmeesseman.com "echo hello"
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const upload = (env, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension" && env.stripLogging)
    {
        const _env = { ...env };
        plugin =
        {   /** @param {import("webpack").Compiler} compiler Compiler */
            apply: (compiler) =>
            {
                compiler.hooks.afterDone.tap("AfterDonePlugin", () =>
                {
                    sourceMapFiles(_env);
                    _upload(_env);
                });
            }
        };
    }
    return plugin;
};


/**
 * @method sourceMapFiles
 * @param {WebpackEnvironment} env
 */
const sourceMapFiles = (env) =>
{
    try {
        const tmpPath = join(env.tempPath, env.app, env.environment);
        if (env.environment === "prod") {
            renameSync(join(env.distPath, "taskexplorer.js.map"), join(tmpPath, "taskexplorer.js.map"));
        }
        else {
            copyFileSync(join(env.distPath, "taskexplorer.js.map"), join(tmpPath, "taskexplorer.js.map"));
        }
        copyFileSync(join(env.buildPath, "node_modules", "source-map", "lib", "mappings.wasm"), join(tmpPath, "mappings.wasm"));
    } catch {}
};


/**
 * @method _upload
 * Uses 'plink' and 'pscp' from PuTTY package: https://www.putty.org
 * !!! For first time build on fresh os install:
 * !!!   - create the environment variable SPMEESSEMAN_COM_APP1_SSH_AUTH_SMEESSEMAN
 * !!!   - run a plink command manually to generate and trust the fingerprints:
 * !!!       plink -ssh -batch -pw <PWD> smeesseman@app1.spmeesseman.com "echo hello"
 * @param {WebpackEnvironment} env
 */
const _upload = (env) =>
{
    const user = "smeesseman",
          host = "app1.spmeesseman.com",
          rBasePath = "/var/www/app1/res/app",
          /** @type {import("child_process").SpawnSyncOptions} */
          spawnSyncOpts = { cwd: env.buildPath, encoding: "utf8", shell: true },
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
        "-pw",    // authenticate
        sshAuth,  // auth key
        // "-q",  // quiet, don't show statistics
        "-r",     // copy directories recursively
        join(env.tempPath, env.app, env.environment),
        `${user}@${host}:"${rBasePath}/${env.app}/v${env.version}/${env.environment}"`
    ];
    writeInfo(`upload debug support files to ${host}`);
    writeInfo(`   create dir    : plink ${plinkArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
    // spawnSync("plink", plinkArgs, spawnSyncOpts);
    writeInfo(`   upload files  : pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`);
    // spawnSync("pscp", pscpArgs, spawnSyncOpts);
    writeInfo("successfully uploaded debug support files");
};


module.exports = upload;

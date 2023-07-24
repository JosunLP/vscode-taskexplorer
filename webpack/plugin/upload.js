/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module webpack.plugin.upload
 *
 * Uses 'plink' and 'pscp' from PuTTY package: https://www.putty.org
 *
 * !!! For first time build on fresh os install:
 * !!!   - create the environment variable SPMEESSEMAN_COM_APP1_SSH_AUTH_SMEESSEMAN
 * !!!   - run a plink command manually to generate and trust the fingerprints:
 * !!!       plink -ssh -batch -pw <PWD> smeesseman@app1.spmeesseman.com "echo hello"
 *
 */

const { join } = require("path");
const { spawnSync } = require("child_process");
const { renameSync, copyFileSync } = require("fs");
const { writeInfo, figures } = require("../console");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackEnvHashState} WebpackEnvHashState */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @method upload
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
        {
            apply: /** @param {WebpackCompiler} compiler Compiler */(compiler) =>
            {
                compiler.hooks.afterDone.tap("AfterDoneUploadPlugin", () =>
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
        if (env.environment === "prod") {
            renameSync(join(env.paths.dist, "taskexplorer.js.map"), join(env.paths.temp, "taskexplorer.js.map"));
        }
        else {
            copyFileSync(join(env.paths.dist, "taskexplorer.js.map"), join(env.paths.temp, "taskexplorer.js.map"));
        }
        copyFileSync(join(env.paths.build, "node_modules", "source-map", "lib", "mappings.wasm"), join(env.paths.temp, "mappings.wasm"));
    } catch {}
};


/**
 * @method _upload
 * @param {WebpackEnvironment} env
 */
const _upload = (env) =>
{
    const host = "app1.spmeesseman.com";
    const hashInfo = /** @type {WebpackEnvHashState} */(env.state.hash[env.environment]);
    if (hashInfo.current === hashInfo.current)
    {
        writeInfo(`content hash unchanged, resource upload to ${host} will be skipped`);
        return;
    }
console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
return;

    const user = "smeesseman",
          rBasePath = "/var/www/app1/res/app",
          /** @type {import("child_process").SpawnSyncOptions} */
          spawnSyncOpts = { cwd: env.paths.build, encoding: "utf8", shell: true },
          sshAuth = process.env.SPMEESSEMAN_COM_APP1_SSH_AUTH_SMEESSEMAN || "InvalidAuth";

    const plinkArgs = [
        "-ssh",   // force use of ssh protocol
        "-batch", // disable all interactive prompts
        "-pw",    // authenticate
        sshAuth,  // auth key
        `${user}@${host}`
    ];

    const pscpArgs = [
        "-pw",    // authenticate
        sshAuth,  // auth key
        // "-q",  // quiet, don't show statistics
        "-r",     // copy directories recursively
        env.paths.temp,
        `${user}@${host}:"${rBasePath}/${env.app.name}/v${env.app.version}"`
    ];

    try {
        const plinkArgsFull = [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}` ];
        writeInfo(`upload resource files to ${host}`);
        writeInfo(`   create dir    : plink ${plinkArgsFull.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
        spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}` ], spawnSyncOpts);
        spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}` ], spawnSyncOpts);
        spawnSync("plink", plinkArgsFull, spawnSyncOpts);
        writeInfo(`   upload files  : pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`);
        spawnSync("pscp", pscpArgs, spawnSyncOpts);
        writeInfo("successfully uploaded resource files");
    }
    catch (e) {
        writeInfo("error uploading resource files:", figures.color.error);
        writeInfo("   " + e.message.trim(), figures.color.error);
    }
};


module.exports = upload;

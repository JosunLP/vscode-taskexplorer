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

const { join, extname } = require("path");
const { spawnSync } = require("child_process");
const { writeInfo, figures } = require("../console");
const { renameSync, copyFileSync, mkdirSync, existsSync, rmSync } = require("fs");

/** @typedef {import("../types").WebpackConfig} WebpackConfig */
/** @typedef {import("../types").WebpackHashState} WebpackHashState */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../types").WebpackGlobalEnvironment} WebpackGlobalEnvironment */


/**
 * @method upload
 * @param {WebpackEnvironment} env
 * @param {WebpackGlobalEnvironment} gEnv Webpack global environment
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const upload = (env, gEnv, wpConfig) =>
{
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build === "extension")
    {
        plugin =
        {
            apply: (compiler) =>
            {
                compiler.hooks.afterDone.tap("AfterDoneUploadPlugin", (statsData) =>
                {
                    if (statsData.hasErrors()) {
                        return;
                    }
                    const stats = statsData.toJson(),
                          assets = stats.assets?.filter(a => a.type === "asset"),
                          chunks = stats.assetsByChunkName;
                    if (!gEnv.uploadCount) {
                        gEnv.uploadCount = 0;
                    }
                    ++gEnv.uploadCount;
                    if (assets && chunks)
                    {
                        sourceMapFiles(assets, chunks, env);
                        _upload(assets, chunks, env, gEnv);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @method sourceMapFiles
 * @param {WebpackStatsAsset[]} assets
 * @param {Record<string, string[]>} chunks
 * @param {WebpackEnvironment} env
 */
const sourceMapFiles = (assets, chunks, env) =>
{
    try {
        if (env.environment === "prod") {
            renameSync(join(env.paths.dist, "taskexplorer.js.map"), join(env.paths.temp, "taskexplorer.js.map"));
        }
        else {
            copyFileSync(join(env.paths.dist, "taskexplorer.js.map"), join(env.paths.temp, "taskexplorer.js.map"));
        }
        copyFileSync(join(env.paths.build, "node_modules", "source-map", "lib", "mappings.wasm"), join(env.paths.temp, "mappings.wasm"));
    }
    catch {}
};


/**
 * @method _upload
 * @param {WebpackStatsAsset[]} assets
 * @param {Record<string, string[]>} chunks
 * @param {WebpackEnvironment} env
 * @param {WebpackGlobalEnvironment} gEnv Webpack global environment
 */
const _upload = (assets, chunks, env, gEnv) =>
{
    const host = "app1.spmeesseman.com";
    // if (JSON.stringify(env.state.hash.next) === JSON.stringify(env.state.hash.current))
    // {
    //     writeInfo(`content hash unchanged, resource upload to ${host} will be skipped`, figures.color.star);
    //     return;
    // }

    const user = "smeesseman",
          rBasePath = "/var/www/app1/res/app",
          lBasePath = join(env.paths.temp, env.environment),
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
        lBasePath,
        `${user}@${host}:"${rBasePath}/${env.app.name}/v${env.app.version}"`
    ];

    if (gEnv.uploadCount === 1)
    // // if (gEnv.uploadCount === 2)
    {
    //     writeInfo(`upload resource files to ${host}`, figures.color.star);
    //     try {
    //         const plinkArgsFull = [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}` ];
    //         writeInfo(`   create dir    : plink ${plinkArgsFull.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
    //         spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}` ], spawnSyncOpts);
    //         spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}` ], spawnSyncOpts);
    //         spawnSync("plink", plinkArgsFull, spawnSyncOpts);
    //     }
    //     catch (e) {
    //         writeInfo("error creating directory to upload resource files:", figures.color.error);
    //         writeInfo("   " + e.message.trim(), figures.color.error);
    //     }
    //     mkdirSync(lBasePath);
    // }
    //     // if (JSON.stringify(env.state.hash.next) !== JSON.stringify(env.state.hash.current))
    //     // {
    //         // try {
    //             writeInfo(`   upload files  : pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`);
    //             spawnSync("pscp", pscpArgs, spawnSyncOpts);
    //             writeInfo("successfully uploaded resource files", figures.color.star);
    //         }
    //         catch (e) {
    //             writeInfo("error uploading resource files:", figures.color.error);
    //             writeInfo("   " + e.message.trim(), figures.color.error);
    //         }
    //     // }
    //     writeInfo("successfully uploaded resource files", figures.color.star);
        if (!existsSync(lBasePath)) {
            mkdirSync(lBasePath);
        }
    }

    assets.filter(a => !!a.chunkNames).forEach((a) =>
    {
        const chunkName = /** @type {String}*/(/** @type {String[]}*/(a.chunkNames)[0]);
        if (env.state.hash.next[chunkName] !== env.state.hash.current[chunkName] && a.info.related)
        {
            const fileNameNoHash = a.name.replace(`.${a.info.contenthash}`, ""),
                  fileNameSourceMap = a.info.related.sourceMap.toString();
            console.log("__________________________________________");
            console.log("" + chunkName);
            console.log("" + fileNameNoHash);
            console.log("" + a.name);
            console.log("" + a.info.related.sourceMap);
            console.log("__________________________________________");
            console.log(JSON.stringify(a, null, 3));
            console.log("__________________________________________");
            copyFileSync(join(env.paths.temp, a.name), join(lBasePath, fileNameNoHash));
            copyFileSync(join(env.paths.temp, fileNameSourceMap), join(lBasePath, fileNameSourceMap));
        }
        else {
            writeInfo(`content in resource ${chunkName} unchanged, skip upload`, figures.color.star);
        }
    });

    if (gEnv.uploadCount === 2)
    {
        writeInfo(`upload resource files to ${host}`, figures.color.star);
        try {
            const plinkArgsFull = [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}/${env.environment}` ];
            writeInfo(`   create dir    : plink ${plinkArgsFull.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
            spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}` ], spawnSyncOpts);
            spawnSync("plink", [ ...plinkArgs, `mkdir ${rBasePath}/${env.app.name}/v${env.app.version}` ], spawnSyncOpts);
            spawnSync("plink", plinkArgsFull, spawnSyncOpts);
            writeInfo(`   upload files  : pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`);
            spawnSync("pscp", pscpArgs, spawnSyncOpts);
            writeInfo("successfully uploaded resource files", figures.color.star);
        }
        catch (e) {
            writeInfo("error uploading resource files:", figures.color.error);
            writeInfo("   " + e.message.trim(), figures.color.error);
        }
        finally {
            rmSync(lBasePath, { recursive: true, force: true });
        }
    }

    // Object.keys(chunks).forEach((k) =>
    // {
    //     const asset = assets.find(a => a.name === assetChunks[k][0]);
    //     if (asset && asset.chunkNames)
    //     {
    //         setAssetState(asset, env, wpConfig);
    //     }
    // });
};


module.exports = upload;

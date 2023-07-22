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
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 * @returns {WebpackPluginInstance | undefined}
 */
const afterdone = (env, wpConfig) =>
{
    // "AfterDonePlugin" MUST BE LAST IN THE PLUGINS ARRAY!!
    /** @type {WebpackPluginInstance | undefined} */
    let plugin;
    if (env.build !== "webview")
    {
        const _env = { ...env },
              _wpConfig = { ...wpConfig };
        plugin =
        {   /** @param {import("webpack").Compiler} compiler Compiler */
            apply: (compiler) =>
            {
                compiler.hooks.afterDone.tap("AfterDonePlugin", () =>
                {
                    if (_env.build === "extension")
                    {
                        copy(_env, _wpConfig);
                        upload(_env);
                    }
                });
            }
        };
    }
    return plugin;
};


/**
 * @param {WebpackEnvironment} env
 * @param {WebpackConfig} wpConfig Webpack config object
 */
const copy = (env, wpConfig) =>
{
    const distPath = join(env.buildPath, "dist"),
          licServerResourcePath = resolve(env.buildPath, "..", "spm-license-server", "res", "app");
    if (env.environment === "prod" || wpConfig.mode === "production")
    {
        try {
            renameSync(join(distPath, "vendor.js.LICENSE.txt"), join(distPath, "vendor.LICENSE"));
            renameSync(join(distPath, "taskexplorer.js.LICENSE.txt"), join(distPath, "taskexplorer.LICENSE"));
            renameSync(
                join(distPath, "taskexplorer.js.map"),
                join(licServerResourcePath, "vscode-taskexplorer", "taskexplorer.js.map")
            );
            copyFileSync(
                join(env.buildPath, "node_modules", "source-map", "lib", "mappings.wasm"),
                join(licServerResourcePath, "app", "shared", "mappings.wasm")
            );
        } catch {}
        try { unlinkSync(join(licServerResourcePath, "vscode-taskexplorer", "taskexplorer.debug.js.LICENSE.txt")); } catch {}
        try { unlinkSync(join(licServerResourcePath, "vscode-taskexplorer", "vendor.debug.js.LICENSE.txt")); } catch {}
    }
    else if (env.environment === "test")
    {
        const outFile = join(distPath, "taskexplorer.js");
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
    }
};


/**
 * @param {WebpackEnvironment} env
 */
const upload = (env) =>
{
    const user = "smeesseman",
          host = "app1.spmeesseman.com",
          rBasePath = "/usr/lib/node_modules/@spmeesseman/spm-license-server/res/app",
          lBasePath = resolve(env.buildPath, "..", "spm-license-server", "res", "app");
    const scpArgs = [
        "-pw", // undocument supply password
        process.env.SPMEESSEMAN_COM_APP1_SSH_PWD || "InvalidPassword",
        "-q", // quiet, don't show statistics
        "-r", // copy directories recursively
        join(lBasePath, env.app, env.environment),
        `${user}@${host}:"${rBasePath}/${env.app}/v${env.version}/${env.environment}"`
    ];
    spawnSync("pscp", scpArgs, { cwd: env.buildPath, encoding: "utf8", shell: true });
};


module.exports = afterdone;

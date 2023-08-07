#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */

const { glob } = require("glob");
const { mergeIf } = require("../webpack/utils");
const { existsSync, copyFileSync, readFileSync, writeFileSync } = require("fs");


//
// CONTROL FLAGS
//
const COPY_NON_EXISTING_FILES = true;
const SYNC_PROJECTS = [ "vscode-extjs", "@spmeesseman/logger", "@spmeesseman/test-utils" ];

/** @type {string[]} */
const notExists = [];


//
// Run from script directtory so we work regardless of where cwd is set
//
if (process.cwd() !== __dirname) { process.chdir(__dirname); }


//
// Command line runtime wrapper
//
const cliWrap = exe => argv => { exe(argv).catch(e => { try { console.error(e); } catch {} process.exit(1); }); };


const copyWpBuildFile = (project, file, dir) =>
{
    const srcFile=`../${dir}/${file}`,
          destFile=`../../${project}/${dir}/${file}`;

    if (COPY_NON_EXISTING_FILES || existsSync(destFile))
    {
        copyFileSync(srcFile, destFile);
        if (project.includes("@spmeesseman/"))
        {
            const contents = readFileSync(destFile, "utf8")
                             .replace(/const \{([\r\n\s]+)/gi, (_r, g1) => `import {${g1}`)
                             .replace(/\} = require\("([a-z0-9\.\/\-_]+)"\);/gi, (_r, g1) => `} from "${g1}";`)
                             // .replace(/\} = require\("([a-z0-9\.\/\-_]+)"\)\.(\w+)/gi, (_r, g1, g2) => `.${g2} } from "${g1}";`)
                             .replace(/module\.exports = (\w+)/gi, (_r, g1) => `export default ${g1}`)
                             .replace(/module\.exports = \{/gi, "export {")
                             .replace(/const (\w+) = require\("([a-z0-9\.\/\-_]+)"\);/gi, (_r, g1, g2) => `import ${g1} from "${g2}";`);
                             // .replace(/const (\w+) = require\("([a-z0-9\.\/\-_]+)"\)\.(\w+)/gi, (_r, g1, g2, g3) => `import ${g1}.${g3} from "${g2}";`);
            writeFileSync(destFile, contents);
        }
        if (project === "vscode-extjs")
        {
            const contents = readFileSync(destFile, "utf8")
                             .replace(/"src", "webview", "app"/gi, '"src", "client", "webview", "app"')
                             .replace(/src([\\\/])webview[\\\/]app/gi, (_v, g) => `src${g}client${g}webview${g}app`);
            writeFileSync(destFile, contents);
        }
    }
    else {
        notExists.push(destFile);
    }
};


const doCustomFileActions = (project) =>
{
    glob("**/*.js", { cwd: `../../${project}/webpack` }, (err, files) =>
    {
        for (const file of notExists)
        {
            // const contents = readFileSync(file);
            for (const eFile of files)
            {
                // const contents = readFileSync(file);
                // if (new RegExp(file).test(basename(eFile)))
                // {
                // }
            }
        }
    });
};


const syncWpBuildExports = (project) =>
{
    copyWpBuildFile(project, "cache.js", "webpack/exports");
    copyWpBuildFile(project, "context.js", "webpack/exports");
    copyWpBuildFile(project, "devtool.js", "webpack/exports");
    // copyWpBuildFile(project, "entry.js", "webpack/exports");
    copyWpBuildFile(project, "experiments.js", "webpack/exports");
    copyWpBuildFile(project, "externals.js", "webpack/exports");
    copyWpBuildFile(project, "ignorewarnings.js", "webpack/exports");
    copyWpBuildFile(project, "index.js", "webpack/exports");
    copyWpBuildFile(project, "minification.js", "webpack/exports");
    copyWpBuildFile(project, "mode.js", "webpack/exports");
    copyWpBuildFile(project, "name.js", "webpack/exports");
    // copyWpBuildFile(project, "optimization.js", "webpack/exports");
    // copyWpBuildFile(project, "output.js", "webpack/exports");
    copyWpBuildFile(project, "plugins.js", "webpack/exports");
    // copyWpBuildFile(project, "resolve.js", "webpack/exports");
    // copyWpBuildFile(project, "rules.js", "webpack/exports");
    copyWpBuildFile(project, "stats.js", "webpack/exports");
    copyWpBuildFile(project, "target.js", "webpack/exports");
    copyWpBuildFile(project, "watch.js", "webpack/exports");
};


const syncWpBuildPlugins = (project) =>
{
    copyWpBuildFile(project, "analyze.js", "webpack/plugin");
    copyWpBuildFile(project, "banner.js", "webpack/plugin");
    copyWpBuildFile(project, "base.js", "webpack/plugin");
    // copyWpBuildFile(project, "clean.js", "webpack/plugin");
    // copyWpBuildFile(project, "copy.js", "webpack/plugin");
    copyWpBuildFile(project, "dispose.js", "webpack/plugin");
    copyWpBuildFile(project, "environment.js", "webpack/plugin");
    // copyWpBuildFile(project, "html.js", "webpack/plugin");
    copyWpBuildFile(project, "ignore.js", "webpack/plugin");
    copyWpBuildFile(project, "index.js", "webpack/plugin");
    copyWpBuildFile(project, "istanbul.js", "webpack/plugin");
    copyWpBuildFile(project, "licensefiles.js", "webpack/plugin");
    copyWpBuildFile(project, "loghooks.js", "webpack/plugin");
    copyWpBuildFile(project, "optimization.js", "webpack/plugin");
    copyWpBuildFile(project, "progress.js", "webpack/plugin");
    // copyWpBuildFile(project, "runtimevars.js", "webpack/plugin");
    copyWpBuildFile(project, "scm.js", "webpack/plugin");
    // copyWpBuildFile(project, "sourcemaps.js", "webpack/plugin");
    copyWpBuildFile(project, "testsuite.js", "webpack/plugin");
    // copyWpBuildFile(project, "tscheck.js", "webpack/plugin");
    copyWpBuildFile(project, "upload.js", "webpack/plugin");
    copyWpBuildFile(project, "vendormod.js", "webpack/plugin");
    //
    // Files for VSCode extension projects
    //
    if (project.startsWith("vscode-"))
    {
        copyWpBuildFile(project, "clean.js", "webpack/plugin");
        copyWpBuildFile(project, "copy.js", "webpack/plugin");
        copyWpBuildFile(project, "html.js", "webpack/plugin");
        copyWpBuildFile(project, "runtimevars.js", "webpack/plugin");
        copyWpBuildFile(project, "sourcemaps.js", "webpack/plugin");
        const destFile=`../../${project}/webpack/plugin/sourcemaps.js`,
              contents = readFileSync(destFile, "utf8").replace(/vendor\|runtime\|tests/gi, "vendor|runtime|tests|serverInterface");
        writeFileSync(destFile, contents);
        // copyWpBuildFile(project, "tscheck.js", "webpack/plugin");
    }
};


const syncWpBuildUtils = (project) =>
{
    copyWpBuildFile(project, "app.js", "webpack/utils");
    copyWpBuildFile(project, "cache.js", "webpack/utils");
    copyWpBuildFile(project, "console.js", "webpack/utils");
    copyWpBuildFile(project, "environment.js", "webpack/utils");
    copyWpBuildFile(project, "global.js", "webpack/utils");
    copyWpBuildFile(project, "index.js", "webpack/utils");
    copyWpBuildFile(project, "utils.js", "webpack/utils");
};


const syncWpBuildFiles = (project) =>
{
    copyWpBuildFile(project, "webpack.config.js", ".");
    // copyWpBuildFile(project, "sync-wp-build.js", "script");
    // copyWpBuildFile(project, "sync-wp-build.sh", "script");
    // if (COPY_WPBUILDRC) {
    // copyWpBuildFile(project, ".wpbuildrc.json", "webpack");
    const srcFile="../webpack/.wpbuildrc.json",
            destFile=`../../${project}/webpack/.wpbuildrc.json`,
            srcRc = JSON.parse(readFileSync(srcFile, "utf8")),
            destRc = JSON.parse(readFileSync(destFile, "utf8")),
            newRc = mergeIf(destRc, srcRc);
    writeFileSync(destFile, JSON.stringify(newRc, null, 4));
    // }
    copyWpBuildFile(project, "index.d.ts", "webpack/types");
    syncWpBuildUtils(project);
    syncWpBuildExports(project);
    syncWpBuildPlugins(project);
    doCustomFileActions(project);
};


cliWrap(async () => SYNC_PROJECTS.forEach(syncWpBuildFiles))();

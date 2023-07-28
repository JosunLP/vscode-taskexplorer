#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */

// cd __dirname


const { glob, IOptions } = "glob";
const { existsSync, copyFileSync, readFileSync, writeFileSync, readdirSync } = require("fs");
const { basename } = require("path");

/** @type {string[]} */
const notExists = [];


syncWpBuildFiles("vscode-extjs");
syncWpBuildFiles("@spmeesseman/logger");
syncWpBuildFiles("@spmeesseman/test-utils");


const copyWpBuildFile = (project, file, dir) =>
{
    const SRCFILE=`../${dir}/${file}`,
          DESTFOLDER=`../../${project}/${dir}`,
          DESTFILE=`../../${project}/${dir}/${file}`;

    if (existsSync)
    {
        copyFileSync(SRCFILE, DESTFOLDER);
        if (DESTPROJECT.includes("@spmeesseman/"))
        {
            const contents = readFileSync(DESTFILE, "utf8")
                             .replace(/const \{([\r\n\s]+)/gi, (_r, g1) => `import {${g1}`)
                             .replace(/\} = require\("([a-z\.\/]+)"\);/gi, (_r, g1) => `} from "${g1}";`)
                             .replace(/module\.exports = (\w+)/gi, (_r, g1) => `export default ${g1}`)
                             .replace(/module\.exports = \{/gi, "export {")
                             .replace(/const (\w+) = require\("([a-z\.\/]+)"\);/gi, (_r, g1) => `import ${g1} from "${g2}";`);
            writeFileSync(SRCFILE, contents);
        }
    }
    else {
        notExists.push(DESTFILE);
    }
};


const doCustomFileActions = (project) =>
{
    glob("**/*.js", { cwd: `../../${project}/webpack` }, (err, files) =>
    {
        const contents = readFileSync(file);
        for (const file of notExists)
        {
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
    copyWpBuildFile(project, "context.js", "webpack/exports");
    copyWpBuildFile(project, "devtool.js", "webpack/exports");
    // copyWpBuildFile(project, "entry.js", "webpack/exports");
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
    copyWpBuildFile(project, "finalize.js", "webpack/plugin");
    copyWpBuildFile(project, "hash.js", "webpack/plugin");
    copyWpBuildFile(project, "ignore.js", "webpack/plugin");
    copyWpBuildFile(project, "index.js", "webpack/plugin");
    copyWpBuildFile(project, "loghooks.js", "webpack/plugin");
    copyWpBuildFile(project, "optimization.js", "webpack/plugin");
    copyWpBuildFile(project, "progress.js", "webpack/plugin");
    copyWpBuildFile(project, "upload.js", "webpack/plugin");
    //
    // Files for VSCode extension projects
    //
    if (project.startsWith("vscode-"))
    {
        // copyWpBuildFile(project, "asset.js", "webpack/plugin");
        // copyWpBuildFile(project, "build.js", "webpack/plugin");
        // copyWpBuildFile(project, "clean.js", "webpack/plugin");
        // copyWpBuildFile(project, "compile.js", "webpack/plugin");
        // if [(project, "= "../../vscode-extjs" ] ; then
        //    copyWpBuildFile(project, "tscheck.js", "webpack/plugin");
        // fi
        copyWpBuildFile(project, "copy.js", "webpack/plugin");
        copyWpBuildFile(project, "html.js", "webpack/plugin");
        copyWpBuildFile(project, "sourcemaps.js", "webpack/plugin");
        const contents = readFileSync(DESTFILE, "utf8")
                         .replace(/vendor\|runtime\|tests/gi, "vendor|runtime|tests|serverInterface");
        writeFileSync(`../../${project}/webpack/plugin/sourcemaps.js`, contents);
    }
};


const syncWpBuildUtils = (project) =>
{
    copyWpBuildFile(project, "console.js", "webpack/utils");
    copyWpBuildFile(project, "global.js", "webpack/utils");
    copyWpBuildFile(project, "utils.js", "webpack/utils");
};


const syncWpBuildFiles = (project) =>
{
    // copyWpBuildFile(project, "webpack.config.js", ".
    // copyWpBuildFile(project, "sync-wp-build.sh script
    // copyWpBuildFile(project, ".wpbuildrc.json webpack
    copyWpBuildFile(project, "index.d.ts", "webpack/types");
    syncWpBuildUtils(project);
    syncWpBuildExports(project);
    syncWpBuildPlugins(project);
    doCustomFileActions(project);
};

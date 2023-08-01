#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */

// const COPY_WPBUILDRC = true;
const COPY_NON_EXISTIN_FILES = true;


if (process.cwd() !== __dirname) { process.chdir(__dirname); }

const { glob } = require("glob");
const { existsSync, copyFileSync, readFileSync, writeFileSync } = require("fs");

/** @type {string[]} */
const notExists = [];


const clone = (item) =>
{
    if (!item) {
        return item;
    }
    if (isDate(item)) {
        return new Date(item.getTime());
    }
    if (isArray(item))
    {
        let i = item.length;
        const c = [];
        while (i--) { c[i] = clone(item[i]); }
        return c;
    }
    if (isObject(item))
    {
        const c = {};
        Object.keys((item)).forEach((key) =>
        {
            c[key] = clone(item[key]);
        });
        return c;
    }
    return item;
};


const copyWpBuildFile = (project, file, dir) =>
{
    const srcFile=`../${dir}/${file}`,
          destFile=`../../${project}/${dir}/${file}`;

    if (COPY_NON_EXISTIN_FILES || existsSync(destFile))
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


const isObject = (v, allowArray) => !!v && (v instanceof Object || typeof v === "object") && (allowArray || !isArray(v));


const isArray = (v, allowEmp) => !!v && Array.isArray(v) && (allowEmp !== false || v.length > 0);


const isDate = (v) => !!v && Object.prototype.toString.call(v) === "[object Date]";


const merge = (...destination) =>
{
    const ln = destination.length;
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i];
        Object.keys(object).forEach((key) =>
        {
            const value = object[key];
            if (isObject(value))
            {
                const sourceKey = destination[0][key];
                if (isObject(sourceKey))
                {
                    merge(sourceKey, value);
                }
                else {
                    destination[0][key] = clone(value);
                }
            }
            else {
                destination[0][key] = value;
            }
        });
    }
    return destination[0];
};


const mergeIf = (...destination) =>
{
    const ln = destination.length;
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i];
        for (const key in object)
        {
            if (!(key in destination[0]))
            {
                const value = object[key];
                if (isObject(value))
                {
                    destination[0][key] = clone(value);
                }
                else {
                    destination[0][key] = value;
                }
            }
        }
    }
    return destination[0];
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
    copyWpBuildFile(project, "base.js", "webpack/plugin");
    copyWpBuildFile(project, "customize.js", "webpack/plugin");
    copyWpBuildFile(project, "environment.js", "webpack/plugin");
    copyWpBuildFile(project, "hash.js", "webpack/plugin");
    copyWpBuildFile(project, "ignore.js", "webpack/plugin");
    copyWpBuildFile(project, "index.js", "webpack/plugin");
    copyWpBuildFile(project, "licensefiles.js", "webpack/plugin");
    copyWpBuildFile(project, "loghooks.js", "webpack/plugin");
    copyWpBuildFile(project, "optimization.js", "webpack/plugin");
    copyWpBuildFile(project, "progress.js", "webpack/plugin");
    copyWpBuildFile(project, "scm.js", "webpack/plugin");
    copyWpBuildFile(project, "upload.js", "webpack/plugin");
    //
    // Files for VSCode extension projects
    //
    if (project.startsWith("vscode-"))
    {
        // copyWpBuildFile(project, "build.js", "webpack/plugin");
        // copyWpBuildFile(project, "clean.js", "webpack/plugin");
        // copyWpBuildFile(project, "compile.js", "webpack/plugin");
        // if [(project, "= "../../vscode-extjs" ] ; then
        //    copyWpBuildFile(project, "tscheck.js", "webpack/plugin");
        // fi
        copyWpBuildFile(project, "copy.js", "webpack/plugin");
        copyWpBuildFile(project, "html.js", "webpack/plugin");
        copyWpBuildFile(project, "runtimevars.js", "webpack/plugin");
        copyWpBuildFile(project, "sourcemaps.js", "webpack/plugin");
        const destFile=`../../${project}/webpack/plugin/sourcemaps.js`,
              contents = readFileSync(destFile, "utf8").replace(/vendor\|runtime\|tests/gi, "vendor|runtime|tests|serverInterface");
        writeFileSync(destFile, contents);
    }
};


const syncWpBuildUtils = (project) =>
{
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


syncWpBuildFiles("vscode-extjs");
syncWpBuildFiles("@spmeesseman/logger");
syncWpBuildFiles("@spmeesseman/test-utils");

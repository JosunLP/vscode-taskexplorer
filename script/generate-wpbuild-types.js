#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */

const { existsSync } = require("fs");
const { promisify } = require("util");
const { posix, resolve } = require("path");
const exec = promisify(require("child_process").exec);
const { unlink, readFile, writeFile } = require("fs/promises");

const description = "Provides types macthing the .wpbuildrc.json configuration file schema";
const autoGenMessage = "This file was auto generated using the 'json-to-typescript' utility";

//
// Run from script directtory so we work regardless of where cwd is set
//
if (process.cwd() !== __dirname) { process.chdir(__dirname); }


//
// Command line runtime wrapper
//
const cliWrap = exe => argv => { exe(argv).catch(e => { try { console.error(e); } catch {} process.exit(1); }); };

/**
 * @function Executes a command via a promisified node exec()
 * @private
 * @param {string} command
 * @returns {Promise<number | null>}
 */
const wrapExec = async (command) =>
{
    let exitCode = null,
        stdout = "", stderr = "";
    const program = command.split(" ")[0],
          procPromise = exec(command, { cwd: resolve("..", "webpack", "types"), encoding: "utf8" }),
          child = procPromise.child;
    child.stdout?.on("data", (data) => { stdout += data; });
    child.stderr?.on("data", (data) => { stderr += data; });
    child.on("close", (code) =>
    {
        exitCode = code;
        console.log(`   ${program} completed with exit code ${code}`);
    });
    await procPromise;
    if (stdout || stderr)
    {
        if ((/error ([0-9]{4})\:/).textstdout || stderr()) {
            const [ _, err ] = match;
            console.error(`   ${program} failed with error: ${err}`);
        }
        if (stdout) {
            console.log(`  ${program}  stderr: ${stdout}`);
        }
        if (stderr) {
            console.log(`   ${program} stderr: ${stderr}`);
        }
    }
    return exitCode;
};


cliWrap(async () =>
{
    const outputFile = "rc.d.ts",
          inputFile = ".wpbuildrc.schema.json",
          baseDir = posix.join("..", "webpack", "types"),
          outputFileTmp = `${outputFile.replace(".d.ts", ".tmp.d.ts")}`,
          tmpOutputPath = resolve(baseDir, outputFileTmp),
          outputPath = resolve(baseDir, outputFile),
          jsontotsFlags = "-f --unreachableDefinitions --style.tabWidth 4 --no-additionalProperties";
    await wrapExec(`json2ts ${jsontotsFlags} -i ${inputFile} -o ${outputFileTmp} --cwd "${baseDir}"`);
    if (existsSync(tmpOutputPath))
    {
        const indexPath = resolve(baseDir, "index.d.ts"),
              indexData = await readFile(indexPath, "utf8"),
              match = indexData.match(/\/\*\*(?:[^]*?)\*\//);
        if (match)
        {
            let hdr = "",
                data = await readFile(tmpOutputPath, "utf8");
            hdr =  match[0]
                   .replace(" with `WpBuild`", " with `WpBuildRc`")
                   .replace("@file types/index.d.ts", `@file types/${outputFile}`)
                   .replace("@spmeesseman Scott Meesseman", (v) => `${v}\r\n *\r\n * ${autoGenMessage}`)
                   .replace("Exports all types for this project", description);
            data = data
                   .replace(/\r\n/g, "\n")
                   .replace(/\/\*\*(?:[^]*?)\*\//g, "")
                   .replace(/\& (?:[A-Za-z]*?)1;\n/g, ";\n")
                   .replace(/export type (?:.*?)1 = string;$/gm, "")
                   // .replace(/\[[a-z]\: string\]\: string;$/gm, "")
                   .replace("[k: string]: string;", "[k: string]: string | undefined;")
                   .replace("export type WpBuildLogLevel1 = number;\n", "")
                   .replace("export type WpBuildLogLevel = WpBuildLogLevel1 & WpBuildLogLevel2;\n", "")
                   .replace("export type WpBuildLogLevel2 = 0 | 1 | 2 | 3 | 4 | 5;", "export type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;")
                   .replace(/\/\* eslint\-disable \*\/$/gm, "")
                   .replace(/\n\}\nexport /g, "\n}\n\nexport ")
                   .replace(/author\?\:(?:[^]*?)\};/g, "author?: string | { name: string; email?: string };")
                   .replace(/export type WebpackEntry =\s+\|(?:[^]*?)\};/g, (v) => v.replace("| string", "string").replace(/\n/g, " ").replace(/ {2,}/g, " "))
                   .replace(/ *\$schema\?\: string;\n/, "")
                   .replace(/(export type (?:.*?)\n)(export type)/g, (_, m1, m2) => `\n${m1}\n${m2}`)
                   .replace(/(";\n)(export (?:type|interface))/g, (_, m1, m2) => `${m1}\n${m2}`)
                   .replace(/\nexport type /g, "\nexport declare type ")
                   .replace(/\nexport interface (.*?) /g, (v, m1) => { if (m1 !== "WpBuildRcSchema") return `\nexport declare type ${m1} = `; return v; })
                   .replace(/\nexport interface (.*?) ([^]*?)\n\}/g, (v, m1, m2) => `export declare interface I${m1} ${m2}\n};\nexport declare type ${m1} = I${m1};\n`)
                   .replace(/ \{\n    /g, " \n{\n    ")
                   .replace(/\n    \| +/g, " | ")
                   .replace(/(?:\n){3,}/g, "\n\n")
                   .replace(/\n/g, "\r\n");
            await writeFile(outputPath, `\r\n${hdr}\r\n\r\n\r\n${data.trim()}\r\n`);
        }
        else {
            console.error(`Could not read header from index file '${indexPath}'`);
        }
    }
    else {
        console.error(`Output file '${tmpOutputPath}' does not exist`);
    }
})();

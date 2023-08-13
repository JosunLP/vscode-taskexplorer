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
        const match = (stdout || stderr).match(/error TS([0-9]{4})\:/);
        if (match) {
            const [ _, err ] = match;
            logger.error(`   tsc failed with error: ${err}`);
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


const isBaseType = (type) => [
        "WpBuildRcExports", "WpBuildRcLog", "WpBuildRcLogPad", "WpBuildRcPaths",
        "WpBuildRcPlugins", "WpBuildRcBuild", "WpBuildLogTrueColor", "WpBuildRcLogColors"
    ].includes(type);


cliWrap(async () =>
{
    const outputFile = "rc.d.ts",
          baseDir = posix.join("..", "webpack", "types"),
          inputFile = ".wpbuildrc.schema.json",
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
                   .replace(/\nexport interface (.*?) /g, (v, m1) => {
                        if (isBaseType(m1)) {
                            return `\nexport declare type Type${m1} = `;
                        }
                        else if (m1 !== "WpBuildRcSchema") {
                            return `\nexport declare type ${m1} = `;
                        }
                        return v;
                    })
                   .replace(/\nexport interface (.*?) ([^]*?)\n\}/g, (v, m1, m2) => `export declare interface I${m1} ${m2}\n};\nexport declare type ${m1} = I${m1};\n`)
                   .replace(/\nexport declare type Type(.*?) ([^]*?)\n\}/g, (v, m1, m2) => {
                        if (isBaseType(m1)) {
                            return `export declare type Type${m1} ${m2}\n};\nexport declare type ${m1} = Required<Type${m1}>;\n`;
                        }
                        return v;
                   })
                   .replace(/\nexport type /g, "\nexport declare type ")
                   .replace(/ \{\n    /g, " \n{\n    ")
                   .replace(/\n    \| +/g, " | ")
                   .replace(/(?:\n){3,}/g, "\n\n")
                   .replace(/[a-z] = +\| +"[a-z]/g, (v) => v.replace("= |", "="))
                   .replace(/\n/g, "\r\n");
            await writeFile(outputPath, `\r\n${hdr}\r\n\r\n\r\n${data.trim()}\r\n`);
            await unlink(tmpOutputPath, `\r\n${hdr}\r\n\r\n\r\n${data.trim()}\r\n`);
            //
            // constants.js
            //
            let match2;
            const exported = [],
                  typedefs = [],
                  lines = [],
                  rgx = /export declare type (\w*?) = (".*?");\r?\n/g;

            while ((match2 = rgx.exec(data)) !== null)
            {
                const [ _, property, values ] = match2;
                exported.push(`    ${property}s`);
                typedefs.push(
                    `/** @typedef {import("../types").${property}} ${property} */`
                );
                lines.push(
                    "/**",
                    ` * @type {${property}[]}`,
                    " */",
                    `const ${property}s = [ ${values.replace(/ \| /g, ", ")} ];\r\n`
                );
            }
            if (lines.length > 0)
            {
                let outputFile2 = "constants.js",
                    outputPath2 = resolve("..", "webpack", "utils", outputFile2);;
                typedefs.sort((a, b) => a.length - b.length);
                hdr = hdr.replace(`@file types/${outputFile}`, `@file utils/${outputFile2}`);
                data = "/* eslint-disable @typescript-eslint/naming-convention */\r\n// @ts-check\r\n\r\n" + hdr + "\r\n\r\n";
                data += typedefs.join("\r\n") + "\r\n\r\n";
                data += lines.join("\r\n") + "\r\n";
                data += `\r\nmodule.exports = {\r\n${exported.join(",\r\n")}\r\n};\r\n`;
                data = data.replace("'json-to-typescript' utility", "'generate-wpbuild-types' script");
                data = data.replace(/'generate\-wpbuild\-types' script(?:[^]+?) \*\//, "\r\n */");
                await writeFile(resolve("..", "webpack", "utils", outputFile2), data);
                //
                // index.js
                //
                outputFile2 = "index.js";
                outputPath2 = resolve("..", "webpack", "utils", outputFile2);
                data = await readFile(outputPath2, "utf8");
                data = data.replace(
                    /\/\* START_CONST_DEFS \*\/(?:.*?)\/\* END_CONST_DEFS \*\//g,
                    `/* START_CONST_DEFS */ ${exported.map(e => e.trim()).join(", ")} /* END_CONST_DEFS */`
                );
                await writeFile(outputPath2, data);
            }
        }
        else {
            throw new Error(`Could not read header from index file '${indexPath}'`);
        }
    }
    else {
        throw new Error(`Output file '${tmpOutputPath}' does not exist`);
    }
})();

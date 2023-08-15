#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */

const { EOL } = require("os");
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


/**
 * @param {string} value
 * @returns {string}
 */
const capitalize = (value) =>
{
    if (value) {
        value = value.charAt(0).toUpperCase() + value.substr(1);
    }
    return value || "";
};


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
                   .replace("@spmeesseman Scott Meesseman", (v) => `${v}\n *\n * ${autoGenMessage}`)
                   .replace("Exports all types for this project", description);
            data = data
                   .replace(/\r\n/g, "\n").replace(new RegExp(EOL,"g"), "\n")
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
                   .replace(/\nexport interface (.*?) /g, (v, m1) =>
                   {
                        if (isBaseType(m1)) {
                            return `\nexport declare type Type${m1} = `;
                        }
                        else if (m1 !== "WpBuildRcSchema") {
                            return `\nexport declare type ${m1} = `;
                        }
                        return v;
                    })
                   .replace(/\nexport interface (.*?) ([^]*?)\n\}/g, (v, m1, m2) => `export declare interface I${m1} ${m2}\n};\nexport declare type ${m1} = I${m1};\n`)
                   .replace(/\nexport declare type Type(.*?) ([^]*?)\n\}/g, (v, m1, m2) =>
                   {
                        if (isBaseType(m1)) {
                            const valuesFmt = m2.replace(/ *\= */, "")
                                                .replace(/\s*(.*?)\??\:(?:.*?);(?:\n\}|\n {4,}|$)/g, (_, m1) => `\n    ${capitalize(m1)} = \"${m1.trim()}\",`)
                                                .replace(/\= \n/g, "\n");
                            return `export declare type Type${m1} ${m2}\n};\n` +
                                   `export declare enum ${m1}Enum ` + (`${valuesFmt}\n};\n`).replace(/",\};/g, "\"\n};\n") +
                                   `export declare type ${m1}Key = keyof ${m1};\n` +
                                   `export declare type ${m1} = Required<Type${m1}>;\n`;
                        }
                        return v;
                   })
                   .replace(/\nexport type /g, "\nexport declare type ")
                   .replace(/ \{\n    /g, " \n{\n    ")
                   .replace(/\n    \| +/g, " | ")
                   .replace(/(?:\n){3,}/g, "\n\n")
                   .replace(/[a-z] = +\| +"[a-z]/g, (v) => v.replace("= |", "="))
                   .replace(/\n\}\n/g, "\n};\n")
                   .replace(/[\w] ;/g, (v) => v.replace(" ", ""))
                   .replace(/([;\{])\n\s*?\n(\s+)/g, (_, m1, m2) => m1 + "\n" + m2)
                   .replace(/ = \{ "= /g, "")
                   .replace(/"\}/g, "\"\n}")
                   .replace(/\n/g, EOL);
            await writeFile(outputPath, `${EOL}${hdr}${EOL}${EOL}${EOL}${data.trim()}${EOL}`);
            await unlink(tmpOutputPath);
            //
            // constants.js
            //
            let match2;
            const exported = [],
                  lines = [],
                  rgx = /export declare type (\w*?) = (".*?");\r?\n/g,
                  rgx2 = new RegExp(`export declare type (WpBuildRcPackageJson|TypeWpBuildRcPaths) = ${EOL}\\{\\s*([^]*?)${EOL}\\};${EOL}`, "g");

            const _pushExport = (property, suffix, values, valueType) =>
            {
                const suffix2 = suffix.substring(0, suffix.length - 1);
                exported.push(`    ${property}${suffix}`, `    is${property}${suffix2} `);
                lines.push(
                    "/**",
                    ` * @type {${!valueType ? `typedefs.${property}[]` : `${valueType}[]`}}`,
                    " */",
                    `const ${property}${suffix} = [ ${values.replace(/ \| /g, ", ")} ];${EOL}`,
                    "/**",
                    " * @param {any} v Variable to check type on",
                    ` * @returns {v is typedefs.${property}}`,
                    " */",
                    `const is${property}${suffix2} = (v) => !!v && ${property}${suffix}.includes(v);${EOL}`
                );
            };

            _pushExport("WebpackMode", "s", '"development" | "none" | "production"');

            while ((match2 = rgx.exec(data)) !== null)
            {
                _pushExport(match2[1], "s", match2[2]);
            }

            while ((match2 = rgx2.exec(data)) !== null)
            {
                const propFmt = match2[1].replace("Type", "");
                const valuesFmt = `"${match2[2].replace(new RegExp(`\\?\\:(.*?);(?:${EOL}    |$)`, "gm"), "\", \"")}"`.replace(/(?:, ""|"", )/g, "");
                _pushExport(propFmt, "Props", valuesFmt, `(keyof typedefs.${propFmt})`);
            }

            if (lines.length > 0)
            {
                let outputFile2 = "constants.js",
                    outputPath2 = resolve("..", "webpack", "utils", outputFile2);
                exported.sort((a, b) => a.localeCompare(b));
                hdr = hdr.replace(`@file types/${outputFile}`, `@file utils/${outputFile2}`);
                // data = "/* eslint-disable @typescript-eslint/naming-convention */${EOL}// @ts-check${EOL}${EOL}" + hdr + "${EOL}${EOL}";
                data = `// @ts-check${EOL}${EOL}${hdr}${EOL}${EOL}`;
                data += `const typedefs = require(\"../types/typedefs\");${EOL}${EOL}`;
                data += lines.join(EOL) + EOL;
                data += `${EOL}module.exports = {${EOL}${exported.join("," + EOL)}${EOL}};${EOL}`;
                data = data.replace("'json-to-typescript' utility", `'generate-wpbuild-types' script together with${EOL} * the 'json-to-typescript' utility`);
                data = data.replace(/ \* the 'json\-to\-typescript' utility(?:[^]+?) \*\//, ` * the 'json-to-typescript' utility${EOL} */`);
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

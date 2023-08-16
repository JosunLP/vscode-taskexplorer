#!/usr/bin/env node
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { EOL } = require("os");
const { existsSync } = require("fs");
const { resolve, join } = require("path");
const WpBuildConsoleLogger = require("../utils/console");
const { capitalize, execAsync } = require("../utils/utils");
const { unlink, readFile, writeFile } = require("fs/promises");
const description = "Provides types macthing the .wpbuildrc.json configuration file schema";
const autoGenMessage = "This file was auto generated using the 'json-to-typescript' utility";


const generateEnums = true;

const requiredProperties = {
    build: "WpBuildRcBuild",
    colors: "WpBuildRcLog",
    mode: "WpBuildRcBuild",
    value: "WpBuildRcLogPad",
    log: "WpBuildRc",
    pad: "WpBuildRcLog",
    default: "WpBuildRcLogColors",
    system: "WpBuildRcLogColors",
    level: "WpBuildRcLog",
    entry: "WpBuildRcBuild",
    paths: "WpBuildRcBuild",
    exports: "WpBuildRcBuild",
    plugins: "WpBuildRcBuild",
    target: "WpBuildRcBuild"
};

//
// Run from script directtory so we work regardless of where cwd is set
//


//
// Command line runtime wrapper
//
const cliWrap = exe => argv => { exe(argv).catch(e => { try { console.error(e); } catch {} process.exit(1); }); };


const isBaseType = (type) => [
        "WpBuildRcExports", "WpBuildRcLog", "WpBuildRcLogPad", "WpBuildRcPaths",
        "WpBuildRcPlugins", "WpBuildRcBuild", "WpBuildLogTrueColor", "WpBuildRcLogColors"
    ].includes(type);


cliWrap(async () =>
{
    const outputFile = "rc.d.ts",
          typesDir = resolve(__dirname, "..",  "types"),
          inputFile = ".wpbuildrc.schema.json",
          schemaDir = resolve(__dirname, "..", "schema"),
          outputFileTmp = `${outputFile.replace(".d.ts", ".tmp.d.ts")}`,
          tmpOutputPath = join(schemaDir, outputFileTmp),
          outputPath = join(typesDir, outputFile),
          jsontotsFlags = "-f --unreachableDefinitions --style.tabWidth 4 --no-additionalProperties";

    const logger = new WpBuildConsoleLogger({
        envTag1: "wpbuild", envTag2: "rctypes", colors: { default: "grey" }, level: 5, pad: { value: 100 }
    });

    logger.printBanner("generate-rc-types.js", "0.0.1", `generating rc configuration file type definitions`);
    logger.log("creating rc configuration file types and typings from schema");
    logger.log("   executing json2ts");

    await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..", "schema") },
        command: `json2ts ${jsontotsFlags} -i ${inputFile} -o ${outputFileTmp} --cwd "${schemaDir}"`
    });

    if (existsSync(tmpOutputPath))
    {
        const enums = [],
              indexPath = resolve(typesDir, "index.d.ts"),
              indexData = await readFile(indexPath, "utf8"),
              match = indexData.match(/\/\*\*(?:[^]*?)\*\//);
        if (match)
        {
            logger.log("   parsing json2ts output");

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
                        if (isBaseType(m1))
                        {
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
                        let src = v;
                        if (isBaseType(m1))
                        {
                            src = `export declare type ${m1} ${m2}\n};\n` +
                                  `export declare type ${m1}Key = keyof ${m1};\n` +
                                  `export declare type Type${m1} = Required<Type${m1}>;\n`;
                            Object.entries(requiredProperties).filter(([ _, t ]) => t === m1).forEach(([ p, _ ]) => {
                                src = src.replace(new RegExp(`${p}\\?\\: `, "g"), `${p}: `);
                            });
                        }
                        if (generateEnums)
                        {
                            const valuesFmt = m2.replace(/ *\= */, "")
                                                // .replace(/\s*(.*?)\??\:(?:.*?);(?:\n\}|\n {4,}|$)/g, (_, m1) => `\n    ${capitalize(m1)}: \"${m1.trim()}\",`)
                                                .replace(/\s*(.*?)\??\:(?:.*?);(?:\n\}|\n {4,}|$)/g, (_, m1) => `\n    ${m1}: \"${m1.trim()}\",`)
                                                .replace(/\= \n/g, "\n");
                            enums.push(
                                `/**\n * @type {{[ key: string ]: keyof typedefs.Type${m1}}}\n */\n` +
                                `const ${m1}Enum =${EOL}${(`${valuesFmt}\n};\n`).replace(/",\};/g, "\"\n};\n").replace(/",\n\};/g, "\"\n};")}`
                            );
                            logger.log(`   modified type ${m1} with enum`);
                        }
                        else {
                            logger.log(`   modified type ${m1}`);
                        }
                        return src;
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
            logger.success(`   created ${outputFile} (${outputPath})`);

            //
            // constants.js
            //
            let match2;
            const exported = [],
                  lines = [],
                  rgx = /export declare type (\w*?) = (".*?");\r?\n/g,
                  rgx2 = new RegExp(`export declare type (WpBuildRcPackageJson|WpBuildRcPaths) = ${EOL}\\{\\s*([^]*?)${EOL}\\};${EOL}`, "g");

            const _pushExport = (property, suffix, values, valueType) =>
            {
                const suffix2 = suffix.substring(0, suffix.length - 1);
                exported.push(`    ${property}${suffix}`, `    is${property}${suffix2}`);
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
                const enumeration = enums.find(e => e.includes(`${property}Enum`));
                if (enumeration) {
                    lines.push(enumeration);
                    exported.push(`    ${property}Enum`);
                }
                logger.log(`   added runtime constants for type ${property}`);
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
                const constantsFile = "constants.js",
                      constantsPath = resolve(__dirname, "..", "utils", constantsFile);
                exported.sort((a, b) => a.localeCompare(b));
                hdr = hdr.replace(`@file types/${outputFile}`, `@file utils/${constantsFile}`);
                data = `/* eslint-disable no-unused-labels */${EOL}// @ts-check${EOL}${EOL}${hdr}${EOL}${EOL}`;
                data += `const typedefs = require(\"../types/typedefs\");${EOL}${EOL}`;
                data += lines.join(EOL) + EOL;
                data += `${EOL}module.exports = {${EOL}${exported.join("," + EOL)}${EOL}};${EOL}`;
                data = data.replace("'json-to-typescript' utility", `'generate-wpbuild-types' script together with${EOL} * the 'json-to-typescript' utility`);
                data = data.replace(/ \* the 'json\-to\-typescript' utility(?:[^]+?) \*\//, ` * the 'json-to-typescript' utility${EOL} */`);
                await writeFile(constantsPath, data);
                logger.success(`   created ${constantsFile} (${constantsPath})`);
                //
                // index.js
                //
                const indexFile = "index.js",
                      indexPath= resolve(__dirname, "..", "utils", indexFile);
                data = await readFile(indexPath, "utf8");
                data = data.replace(
                    /\/\* START_CONST_DEFS \*\/(?:.*?)\/\* END_CONST_DEFS \*\//g,
                    `/* START_CONST_DEFS */ ${exported.map(e => e.trim()).join(", ")} /* END_CONST_DEFS */`
                );
                await writeFile(indexPath, data);
                logger.success(`   added constants exports to ${constantsFile} (${constantsPath})`);
            }
        }
        else {
            logger.error(`Could not read header from index file '${indexPath}'`);
        }
    }
    else {
        logger.error(`Output file '${tmpOutputPath}' does not exist`);
    }

    logger.write("rc types and typings created successfully");
})();

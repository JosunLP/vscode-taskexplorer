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
    target: "WpBuildRcBuild",
    type: "WpBuildRcBuild",
    base: "WpBuildRcPaths"
};

const outputDtsFile = "rc.d.ts";
const outputDtsDir = resolve(__dirname, "..",  "types");
const outputDtsPath = join(outputDtsDir, outputDtsFile);

/** @type {string[]} */
const enums = [];

/** @type {string[]} */
const exported = [];

/** @type {string[]} */
const lines = [];

/** @type {WpBuildConsoleLogger} */
let logger;


//
// Run from script directtory so we work regardless of where cwd is set
//


//
// Command line runtime wrapper
//
const cliWrap = exe => argv => { exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); }); };


const isBaseType = (type) => [
        "WpBuildRcExports", "WpBuildRcLog", "WpBuildRcLogPad", "WpBuildRcPaths",
        "WpBuildRcPlugins", "WpBuildRcBuild", "WpBuildLogTrueColor", "WpBuildRcLogColors"
    ].includes(type);


const parseTypesDts = async (hdr, data) =>
{
    logger.log("   parsing json2ts output");

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
                              `export declare type Type${m1} = Required<${m1}>;\n`;
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
                      logger.log(`      modified type ${m1} with enum`);
                  }
                  else {
                      logger.log(`      modified type ${m1}`);
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

    await writeFile(outputDtsPath, `${EOL}${hdr}${EOL}${EOL}${EOL}${data.trim()}${EOL}`);

    logger.success(`   created ${outputDtsFile} (${outputDtsPath})`);
    return data;
};


const pushExport = (property, suffix, values, valueType) =>
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
    logger.log(`      added runtime constants for type ${property}`);
};


const writeConstantsJs = async (hdr, data) =>
{
    logger.log("   create implementation constants from new types");

    let match;
    const rgx = /export declare type (\w*?) = (".*?");\r?\n/g,
          rgx2 = new RegExp(`export declare type (WpBuildRcPackageJson|WpBuildRcPaths) = ${EOL}\\{\\s*([^]*?)${EOL}\\};${EOL}`, "g");

    pushExport("WebpackMode", "s", '"development" | "none" | "production"');

    while ((match = rgx.exec(data)) !== null)
    {
        pushExport(match[1], "s", match[2]);
    }

    while ((match = rgx2.exec(data)) !== null)
    {
        const propFmt = match[1].replace("Type", ""),
                valuesFmt = `"${match[2].replace(new RegExp(`[\\?]?\\:(.*?);(?:${EOL}    |$)`, "gm"), "\", \"")}"`
                                        .replace(/(?:, ""|"", )/g, "");
        pushExport(propFmt, "Props", valuesFmt, `(keyof typedefs.${propFmt})`);
    }

    if (lines.length > 0)
    {
        const constantsFile = "constants.js",
              constantsDir = resolve(__dirname, "..", "utils"),
              constantsPath = join(constantsDir, constantsFile),
              constantsData = await readFile(constantsPath, "utf8");

        exported.sort((a, b) => a.localeCompare(b));
        hdr = hdr.replace(`@file types/${outputDtsFile}`, `@file utils/${constantsFile}`);
        data = `/* eslint-disable no-unused-labels */${EOL}// @ts-check${EOL}${EOL}${hdr}${EOL}${EOL}`;
        data += `const typedefs = require(\"../types/typedefs\");${EOL}${EOL}`;
        data += lines.join(EOL) + EOL;
        data += `${EOL}module.exports = {${EOL}${exported.join("," + EOL)}${EOL}};${EOL}`;
        data = data.replace("'json-to-typescript' utility", `'generate-wpbuild-types' script together with${EOL} * the 'json-to-typescript' utility`);
        data = data.replace(/ \* the 'json\-to\-typescript' utility(?:[^]+?) \*\//, ` * the 'json-to-typescript' utility${EOL} */`);

        await writeFile(constantsPath, data);
        logger.success(`   created ${constantsFile} (${constantsPath})`);

        const code = await execAsync({
            logger,
            logPad: "   ",
            program: "tsc",
            execOptions: { cwd: constantsDir },
            command: `npx tsc --noEmit --skipLibCheck --allowJs ./${constantsFile}`
        });

        if (code !== 0) {
            logger.error(`   created ${constantsFile}  but tsc types validation failed`);
            await writeFile(constantsPath, constantsData);
            logger.error(`   previous content restored (${constantsPath})`);
        }

        return data;
    }
};


const writeIndexJs = async () =>
{
    const indexFile = "index.js",
          indexPath= resolve(__dirname, "..", "utils", indexFile);
    let data = await readFile(indexPath, "utf8");
    data = data.replace(
        /\/\* START_CONST_DEFS \*\/(?:.*?)\/\* END_CONST_DEFS \*\//g,
        `/* START_CONST_DEFS */ ${exported.map(e => e.trim()).join(", ")} /* END_CONST_DEFS */`
    );
    await writeFile(indexPath, data);
    logger.success(`   updated exports in utils/${indexFile} (${indexPath})`);
};


cliWrap(async () =>
{
    logger = new WpBuildConsoleLogger({
        envTag1: "wpbuild", envTag2: "rctypes", colors: { default: "grey" }, level: 5, pad: { value: 100 }
    });
    logger.printBanner("generate-rc-types.js", "0.0.1", `generating rc configuration file type definitions`);

    const inputFile = ".wpbuildrc.schema.json",
          schemaDir = resolve(__dirname, "..", "schema"),
          indexPath = resolve(__dirname, "..", "types", "index.d.ts"),
          jsontotsFlags = "-f --unreachableDefinitions --style.tabWidth 4 --no-additionalProperties";

    let data = await readFile(indexPath, "utf8");
    const match = data.match(/\/\*\*(?:[^]*?)\*\//);
    if (!match) {
        throw new Error(`Could not read header from index file 'index.d.ts'`);
    }

    data = await readFile(outputDtsPath, "utf8");
    const hdr =  match[0]
          .replace(" with `WpBuild`", " with `WpBuildRc`")
          .replace("@file types/index.d.ts", `@file types/${outputDtsFile}`)
          .replace("@spmeesseman Scott Meesseman", (v) => `${v}\n *\n * ${autoGenMessage}`)
          .replace("Exports all types for this project", description);;

    logger.log("creating rc configuration file types and typings from schema");
    logger.log("   executing json2ts");

    let code = await execAsync({
        logger,
        logPad: "   ",
        execOptions: { cwd: resolve(__dirname, "..", "schema") },
        command: `json2ts ${jsontotsFlags} -i ${inputFile} -o ${outputDtsPath} --cwd "${schemaDir}"`
    });

    if (code !== 0) {
        throw new Error(`   json2ts exited with failure code`);
    }
    else if (!existsSync(outputDtsPath)) {
        throw new Error(`Output file '${outputDtsFile}' does not exist`);
    }

    code = await execAsync({
        logger,
        logPad: "   ",
        program: "tsc",
        execOptions: { cwd: outputDtsDir },
        command: `npx tsc --noEmit --skipLibCheck ./${outputDtsFile}`
    });

    if (code !== 0) {
        await writeFile(outputDtsPath, data);
        throw new Error(`created ${outputDtsFile} but tsc types validation failed, previous content restored`);
    }

    logger.success(`   created ${outputDtsFile} (${outputDtsPath})`);

    data = await readFile(outputDtsPath, "utf8");
    data = await parseTypesDts(hdr, data);
    data = await writeConstantsJs(hdr, data);
    await writeIndexJs();

    logger.write("rc types and typings created successfully");
})();

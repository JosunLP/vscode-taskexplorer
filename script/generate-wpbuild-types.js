#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */

const { glob } = require("glob");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const { existsSync, copyFileSync, readFileSync, writeFileSync } = require("fs");
const { unlink, readFile, writeFile } = require("fs/promises");
const { join, posix } = require("path");

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
exec = async (command) =>
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
        const clrCode = logger.withColor(code?.toString(), code === 0 ? logger.colors.green : logger.colors.red);
        exitCode = code;
        console.log(`   ${program} completed with exit code bold(${clrCode})`);
    });
    await procPromise;
    if (stdout || stderr)
    {
        if ((/error ([0-9]{4})\:/).textstdout || stderr()) {
            const [ _, err ] = match;
            console.error(`   ${program} failed with error: ${err}`);
        }
        if (stdout) {
            console.log(`  ${program}  stderr: ${stdout}`, 5, "", logger.icons.color.star, logger.colors.yellow);
        }
        if (stderr) {
            console.log(`   ${program} stderr: ${stderr}`, 5, "", logger.icons.color.star, logger.colors.yellow);
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
          tmpOutputPathRel = posix.join(baseDir, outputFileTmp),
          tmpOutputPath = resolve(baseDir, outputFileTmp),
          outputPath = resolve(baseDir, outputFile),
          jsontotsFlags = "-f --unreachableDefinitions --style.tabWidth 4 --no-additionalProperties";
    await this.exec(`json2ts ${jsontotsFlags} -i ${inputFile} -o ${tmpOutputPathRel}`); // --cwd ${baseDir}`);
    if (existsSync(tmpOutputPath))
    {
        const data = await readFile(outputPath, "utf8");
        data = data.replace(/\/\*\*(?:[^]*?)\*\//g, "")
                   .replace(/export type (?:.*?)1 = string;$/gm, "")
                   .replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")
                   .replace(/[\r\n][\r\n]/g, "\r\n");
        await writeFile(outputPath, data);
        await unlink(outputPath);
    }
})();

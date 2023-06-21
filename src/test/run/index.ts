/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
//
// Recommended modules, loading them here to speed up NYC init
// and minimize risk of race condition
//
import "ts-node/register";
import "source-map-support/register";

import { resolve } from "path";
import runConfig from "./config";
import foreground from "foreground-child";


export async function run(): Promise<void>
{
    const runCfg = await runConfig(resolve(__dirname, ".."));
    preparePlatform();
/*
    foreground(childArgs, async () =>
    {
        const mainChildExitCode = process.exitCode;
        try {
            await runCfg.nyc.writeProcessIndex();
            // runCfg.nyc.maybePurgeSourceMapCache();
            // if (argv.checkCoverage)
            // {
            //     await runCfg.nyc.checkCoverage(
            //     {
            //         lines: argv.lines,
            //         functions: argv.functions,
            //         branches: argv.branches,
            //         statements: argv.statements
            //     },
            //     argv["per-file"]).catch(suppressEPIPE);
            //     process.exitCode = process.exitCode || mainChildExitCode;
            // }
            await runCfg.nyc.writeCoverageFile();
            //
            // Capture text-summary reporter's output and log it in console
            //
            console.log(await captureStdout(runCfg.nyc.report.bind(runCfg.nyc)));
            // if (!argv.silent) {
            //     await runCfg.nyc.report().catch(suppressEPIPE)
            // }
        }
        catch (error) {
            process.exitCode = process.exitCode || mainChildExitCode || 1;
            console.error(error.message);
        }
    });
*/
    let mochaError: Error | undefined,
        failures = 0;

    try {
        failures = await new Promise(resolve => runCfg.mocha.run(resolve));
    }
    catch (e) { mochaError = e; }

    if (runCfg.nyc)
    {
        try {
            await runCfg.nyc.writeCoverageFile();
            //
            // Capture text-summary reporter's output and log it in console
            //
            console.log(await captureStdout(runCfg.nyc.report.bind(runCfg.nyc)));
        }
        catch (e) {
            console.log("!!!");
            console.log("!!! Error writing coverage file:");
            try {
                console.log("!!!    " + e.toString());
            } catch {}
            console.log("!!!");
        }
    }

    if (failures > 0 || mochaError)
    {
        throw new Error(!mochaError ? `${failures} tests failed.` : mochaError.message);
    }
}


async function captureStdout(fn: any)
{
    // eslint-disable-next-line prefer-const
    let w = process.stdout.write, buffer = "";
    process.stdout.write = (s: string) => { buffer = buffer + s; return true; };
    await fn();
    process.stdout.write = w;
    return buffer;
}


function suppressEPIPE (error)
{   //
    // Prevent dumping error when `nyc npm t|head` causes stdout to be closed when reporting runs
    //
    if (error.code !== "EPIPE") { throw error; }
}


function preparePlatform()
{   //
    // Linux: prevent a weird NPE when mocha on Linux requires the window size from the TTY
    // Since we are not running in a tty environment, we just implement he method statically
    //
    if (process.platform === "linux")
    {
        const tty = require("tty");
        if (!tty.getWindowSize)
        {
            tty.getWindowSize = (): number[] => [ 80, 75 ];
        }
    }
}

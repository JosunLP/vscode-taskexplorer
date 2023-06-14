/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
"use strict";
//
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import Mocha from "mocha";
const NYC = require("nyc");

//
// Simulates the recommended config option
// extends: "@istanbuljs/nyc-config-typescript",
// import * as baseConfig from "@istanbuljs/nyc-config-typescript";

// const sleep = (ms: number) =>
// {
//     return new Promise(resolve => setTimeout(resolve, ms));
// };


export default async() =>
{
    const xArgs = JSON.parse(process.env.xArgs || "[]"),
          testArgs = JSON.parse(process.env.testArgs || "[]"),
          // testsRoot = path.resolve(__dirname, ".."),  // <- WP
          // nycRoot = path.resolve(__dirname, "..", "..", ".."),
          testsRoot = path.resolve(__dirname),           // <- TS
          nycRoot = path.resolve(__dirname, "..", ".."), // <- TS
          projectRoot = path.resolve(testsRoot, ".."),
          cover = fs.existsSync(path.join(projectRoot, "extension.js.map"));

    let nyc: any;
    if (cover)
    {
        // Setup coverage pre-test, including post-test hook to report
        nyc = new NYC({
            extends: "@istanbuljs/nyc-config-typescript",
            cwd: nycRoot,
            reportDir: "./.coverage",
            tempDir: "./.nyc_output",
            reporter: [ "text-summary", "html", "lcov", "cobertura" ],
            all: true,
            // cache: false,
            silent: false,
            instrument: true,
            // sourceMap: true,
            // instrument: false,
            // sourceMap: false,
            hookRequire: true,
            hookRunInContext: true,
            hookRunInThisContext: true,
            noClean: process.env.testArgs && process.env.testArgs.includes("--nyc-no-clean"),
            // useSpawnWrap: true,
            include: [ "dist/**/*.js" ],
            exclude: [ "dist/test/**", "**/external*.*", "external*" ],
        });
        await nyc.wrap();

        //
        // Check the modules already loaded and warn in case of race condition
        // (ideally, at this point the require cache should only contain one file - this module)
        //
        // console.log("Check requires cache");
        // Object.keys(require.cache).forEach((reqKey) => {
        //     console.log("   " + reqKey);
        // });
        const myFilesRegex = /vscode-taskexplorer\/dist/;
        const filterFn = myFilesRegex.test.bind(myFilesRegex);
        if (Object.keys(require.cache).filter(filterFn).length > 1)
        {
            console.warn("NYC initialized after modules were loaded", Object.keys(require.cache).filter(filterFn));
        }

        //
        // Debug which files will be included/excluded
        // console.log('Glob verification', await nyc.exclude.glob(nyc.cwd));
        //
        if (xArgs.includes("--no-clean"))
        {
            await nyc.createTempDirectory();
        }
        else {
            try {
                await nyc.reset();
            }
            catch {
                await nyc.createTempDirectory();
            }
        }
    }

    //
    // Create the mocha test
    //
    const mocha = new Mocha({
        ui: "tdd", // the TDD UI is being used in extension.test.ts (suite, test, etc.)
        color: true, // colored output from test results,
        timeout: 30000, // default timeout: 10 seconds
        retries: 0, // ,
        slow: 250,
        require: [
            "ts-node/register",
            "source-map-support/register"
        ]
        // reporter: "mocha-multi-reporters",
        // reporterOptions: {
        //     reporterEnabled: "spec, mocha-junit-reporter",
        //     mochaJunitReporterReporterOptions: {
        //         mochaFile: __dirname + "/../../coverage/junit/extension_tests.xml",
        //         suiteTitleSeparatedBy: ": "
        //     }
        // }
    });

    let filesToTest = "**/*.test.js";
    if (testArgs.length > 0)
    {
        filesToTest = (testArgs.length > 1 ? "{" : "");
        testArgs.forEach((a: string) =>
        {
            if (filesToTest.length > 1) {
                filesToTest += ",";
            }
            filesToTest += `**/${a}.test.js`;
        });
        filesToTest += (testArgs.length > 1 ? "}" : "");
    }

    //
    // Add all files to the test suite
    //
    const files = glob.sync(filesToTest, { cwd: testsRoot });
    files.sort((a: string, b: string) => {
        return path.basename(a) < path.basename(b) ? -1 : 1;
    });
    // const files = glob.sync(`{**/_api.test.js,**/${fileToTest}.test.js}`, { cwd: testsRoot });
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    return {
        nyc,
        mocha
    };
};

/* eslint-disable import/no-extraneous-dependencies */

import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import Mocha from "mocha";
const NYC = require("nyc");


export default async() =>
{
    let nyc: any;
    const xArgs = JSON.parse(process.env.xArgs || "[]"),
          testArgs = JSON.parse(process.env.testArgs || "[]"),
          projectRoot = path.resolve(__dirname, "..", ".."),
          isWebpackBuild = fs.existsSync(path.join(projectRoot, "dist", "vendor.js")),
          cover = !xArgs.includes("--no-coverage"),
          noClean = xArgs.includes("--nyc-no-clean");

    if (cover)
    {   //
        // This block of code is basically a modified version of nyc/bin/nyc.js
        //
        nyc = new NYC({
            extends: "@istanbuljs/nyc-config-typescript",
            all: false,
            // cache: true, // enabling cache breaks storage tests??? @istanbuljs/nyc-config-typescript sets to false explicitly
            cwd: projectRoot,
            hookRequire: true,
            hookRunInContext: true,
            hookRunInThisContext: true,
            instrument: true,
            noClean,
            reportDir: "./.coverage",
            tempDir: "./.nyc_output",
            silent: false,
            // sourceMap: true,
            // sourceMap: false,
            // useSpawnWrap: true,
            exclude: [
                "dist/test/**", "dist/webpack/**", "<node_internals>/**", "<node_externals>/**", "<externals>/**",
                "<vscode>/**", "<vscode_externals>/**", "<externals_vscode>/**", "dist/vendor.js"
            ],
            // ignoreClassMethod: [ "error", "catch", "log.error" ],
            include: !isWebpackBuild ? [ "dist/**/*.js" ] : [ "dist/taskexplorer.js" ],
            reporter: [ "text-summary", "html", "lcov", "cobertura" ]
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
        const myFilesRegex = /vscode-taskexplorer\/dist/,
              filterFn = myFilesRegex.test.bind(myFilesRegex);
        if (Object.keys(require.cache).filter(filterFn).length > 1)
        {
            console.warn("NYC initialized after modules were loaded", Object.keys(require.cache).filter(filterFn));
        }

        //
        // Debug which files will be included/excluded
        // console.log('Glob verification', await nyc.exclude.glob(nyc.cwd));
        //
        if (noClean)
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
        // require: [
        //     "ts-node/register",
        //     "source-map-support/register"
        // ]
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
    const testsRoot = path.resolve(__dirname),
          files = glob.sync(filesToTest, { cwd: testsRoot });
    files.sort((a: string, b: string) => path.basename(a) < path.basename(b) ? -1 : 1)
         .forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    return {
        nyc,
        mocha
    };
};

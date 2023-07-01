/* eslint-disable import/no-extraneous-dependencies */

import { resolve } from "path";
import { TestUtils } from "@spmeesseman/test-utils";


export const run = (): Promise<void> =>
{
    const xArgs = JSON.parse(process.env.xArgs || "[]"),
		  testArgs = JSON.parse(process.env.testArgs || "[]"),
		  clean = !xArgs.includes("--nyc-no-clean") || xArgs.includes("--nyc-clean"),
		  projectRoot = resolve(__dirname, "..", "..", ".."),
		  verbose = xArgs.includes("--nyc-verbose"),
		  silent = xArgs.includes("--nyc-silent");

	return new TestUtils(
	{
		isTypescript: true,
		moduleBuildDir: "dist",
		moduleName: "vscode-taskexplorer",
		projectRoot,
		register: {
			sourceMapSupport: true,
			tsNode: true
		},
		coverage: {
			clean,
			tool: "nyc",
			config: {
				clean,
				extends: "@istanbuljs/nyc-config-typescript",
				cwd: projectRoot,
				hookRequire: true,
				hookRunInContext: true,
				hookRunInThisContext: true,
				ignoreClassMethods: [ "require " ],
				instrument: true,
				reportDir: "./.coverage",
				showProcessTree: verbose,
				silent,
				skipEmpty: true,
				reporter: [ "text-summary", "html" ],
				include: [ "dist/taskexplorer.js" ],
				exclude: [ "dist/test", "node_modules", "dist/vendor.js", "dist/runtime.js" ]
			},
		},
		tests: {
			tool: "mocha",
			root: __dirname,
			suite: testArgs,
			config: {
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
			}
		}
	})
	.run();
};

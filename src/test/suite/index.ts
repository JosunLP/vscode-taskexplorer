/* eslint-disable import/no-extraneous-dependencies */

import { join, resolve } from "path";
import { TestRunner } from "@spmeesseman/test-utils";
import { copyFileSync, existsSync, mkdirSync } from "fs";


export const run = async (): Promise<void> =>
{
    const xArgs = JSON.parse(process.env.xArgs || "[]"),
		  testArgs = JSON.parse(process.env.testArgs || "[]"),
		  clean = !xArgs.includes("--nyc-no-clean") || xArgs.includes("--nyc-clean"),
		  projectRoot = resolve(__dirname, "..", "..", ".."),
		  verbose = xArgs.includes("--nyc-verbose"),
		  silent = xArgs.includes("--nyc-silent"),
		  userDir = <string>process.env.vscodeTestUserDataPath,
          testWorkspaceMultiRoot = join(projectRoot, "test-fixture");

	//
	// Copy a "User Tasks" file
	//
	if (!existsSync(join(userDir, "user-data"))) {
		mkdirSync(join(userDir, "user-data"));
	}
	if (!existsSync(join(userDir, "User"))) {
		mkdirSync(join(userDir, "User"));
	}
	copyFileSync(join(testWorkspaceMultiRoot, "user-tasks.json"), join(userDir, "User", "tasks.json"));

	const runner = new TestRunner(
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
			htmlReportDark: true,
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
				reporter: [
					"text-summary", "html" // "text","lcov", "cobertura", "json", "lcov"
				],
				include: [
					"dist/taskexplorer.js"
				],
				exclude: [
					"dist/test", "node_modules", "dist/vendor.js", "dist/runtime.js"
				]
			}
		},
		framework: {
			type: "mocha",
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
	});

	try {
		await runner.run();
	}
	catch (error) {
		try {
			console.error(error.message);
		} catch (_) {}
		process.exit(1);
	};
};

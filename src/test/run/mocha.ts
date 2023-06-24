/* eslint-disable import/no-extraneous-dependencies */

import Mocha from "mocha";
import * as glob from "glob";
import { basename, resolve } from "path";


export default (testsRoot: string) =>
{
    const testArgs = JSON.parse(process.env.testArgs || "[]");
	//
	// Create the mocha test
	//
	const mocha = new Mocha({
		ui: "tdd",
		color: true,
		timeout: 30000,
		retries: 0,
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

	let filesToTest = "**/*.{spec,test}.js";
	if (testArgs.length > 0)
	{
		filesToTest = (testArgs.length > 1 ? "{" : "");
		testArgs.forEach((a: string) =>
		{
			if (filesToTest.length > 1) {
				filesToTest += ",";
			}
			filesToTest += `**/${a}.{spec,test}.js`;
		});
		filesToTest += (testArgs.length > 1 ? "}" : "");
	}

	//
	// Add all files to the test suite
	//
	const files = glob.sync(filesToTest, { cwd: testsRoot });
	files.sort((a: string, b: string) => basename(a) < basename(b) ? -1 : 1)
			.forEach(f => mocha.addFile(resolve(testsRoot, f)));

	return mocha;
};

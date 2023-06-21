
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

type NycConfig = Record<string, boolean | string | string[]>;


export default (): NycConfig =>
{
	const xArgs = JSON.parse(process.env.xArgs || "[]"),
		projectRoot = resolve(__dirname, "..", "..", ".."),
		isWebpackBuild = existsSync(join(projectRoot, "dist", "vendor.js")),
		noClean = xArgs.includes("--nyc-no-clean");

	return <NycConfig>{
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
	};
};

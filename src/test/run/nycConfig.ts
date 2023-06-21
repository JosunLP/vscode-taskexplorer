
import { existsSync } from "fs";
import { join, normalize } from "path";

type NycConfig = Record<string, boolean | string | string[]>;


export default (): NycConfig =>
{
	const xArgs = JSON.parse(process.env.xArgs || "[]"),
		projectRoot = normalize(join(__dirname, "..", "..", "..")),
		isWebpackBuild = existsSync(join(projectRoot, "dist", "vendor.js")),
		noClean = xArgs.includes("--nyc-no-clean");

	return <NycConfig>{
		extends: "@istanbuljs/nyc-config-typescript",
		all: false,
		cwd: projectRoot,
		hookRequire: true,
		hookRunInContext: true,
		hookRunInThisContext: true,
		// ignoreClassMethod: [ "error", "catch", "log.error" ],
		instrument: true,
		noClean,
		reportDir: "./.coverage",
		showProcessTree: true,
		silent: false,
		tempDir: "./.nyc_output",
		useSpawnWrap: false,
		reporter: [ "text-summary", "html" ],
		include: !isWebpackBuild ? [ "dist/**/*.js" ] : [ "dist/taskexplorer.js" ],
		exclude: !isWebpackBuild ? [ "dist/**/test/**", "node_modules/**", "dist/vendor.js" ] :
								   [ "dist/**/test/**", "dist/webpack/**", "node_modules/**", "dist/vendor.js", "dist/runtime.js" ]
	};
};

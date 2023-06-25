
import { existsSync } from "fs";
import { join, normalize } from "path";

type NycConfig = Record<string, boolean | string | string[]>;


export default (): NycConfig =>
{
	const xArgs = JSON.parse(process.env.xArgs || "[]"),
		  projectRoot = normalize(join(__dirname, "..", "..", "..")),
		  isWebpackBuild = existsSync(join(projectRoot, "dist", "runtime.js")),
		  verbose = xArgs.includes("--nyc-verbose");

	return <NycConfig>{
		extends: "@istanbuljs/nyc-config-typescript",
		cwd: projectRoot,
		hookRequire: true,
		hookRunInContext: true,
		hookRunInThisContext: true,
		ignoreClassMethods: [ "require " ],
		instrument: true,
		reportDir: "./.coverage",
		showProcessTree: verbose,
		silent: false,
		skipEmpty: true,
		reporter: [ "text-summary", "html" ],
		// require: [ "mocha", "string_decoder", "fs", "path", "os" ],
		include: !isWebpackBuild ? [ "dist/**/*.js" ] : [ "dist/taskexplorer.js" ],
		exclude: !isWebpackBuild ? [ "dist/test", "node_modules" ] :
								   [ "dist/test", "node_modules", "dist/vendor.js", "dist/runtime.js" ]
	};
};

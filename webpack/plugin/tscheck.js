/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @module wpbuild.plugin.tscheck
 */

const path = require("path");
const ForkTsCheckerPlugin = require("fork-ts-checker-webpack-plugin");
const { existsSync } = require("fs");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {"write-tsbuildinfo" | "readonly" | "write-dts" | "write-references" | undefined} TsCheckMode */


/**
 * @param {WpBuildEnvironment} env
 * @returns {(ForkTsCheckerPlugin)[]}
 */
const tscheck = (env) =>
{
	/** @type {ForkTsCheckerPlugin[]} */const plugins = [];
	/** @type {[ string, TsCheckMode, boolean? ][]} */const tsConfigs = [];

	if (env.app.plugins.tscheck !== false)
	{
		if (env.build === "webview")
		{
			tsConfigs.push(
				[ path.join(env.paths.base, "tsconfig.json"), undefined ]
			);
		}
		else if (env.build === "tests")
		{
			tsConfigs.push(
				[ path.join(env.paths.build, "src", "test", "tsconfig.json"), "write-tsbuildinfo" ]
			);
		}
		else
		{
			tsConfigs.push(
				[ path.join(env.paths.build, "tsconfig.types.json"), "write-tsbuildinfo" ],
				[ path.join(env.paths.build, "types", "tsconfig.json"), "write-tsbuildinfo" ],
				[ path.join(env.paths.build, `tsconfig.${env.target}.json`), "write-tsbuildinfo" ],
				[ path.join(env.paths.build, env.build === "web" ? "tsconfig.web.json" : "tsconfig.json"), "write-tsbuildinfo" ]
			);
			// if (env.paths.base !== env.paths.build)
			// {
			// 	tsConfigs.splice(2, 0,
			// 		[ path.join(env.paths.base, "types", "tsconfig.json"), "write-tsbuildinfo" ]
			// 	);
			// }
			if (env.environment === "test")
			{
				tsConfigs.push(
					[ path.join(env.paths.build, "tsconfig.test.json"), "readonly" ],
					[ path.join(env.paths.build, "src", "test", "tsconfig.json"), "readonly" ]
				);
			}
		}

		tsConfigs.filter(tsCfg => existsSync(tsCfg[0])).forEach((tsCfg) =>
		{
			plugins.push(
				new ForkTsCheckerPlugin(
				{
					async: false,
					formatter: "basic",
					typescript: {
						build: !!tsCfg[2],
						mode: tsCfg[1],
						configFile: tsCfg[0],
					}
				})
			);
		});
	}

	return plugins;
};


module.exports = tscheck;


/**
 * @file types/wpbuild.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 * 
 * Handy file links:
 * 
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 * 
 * @description
 *
 * Defined types for internal WpBuild module are prefixed with `WpBuild` (type)
 * and `IWpBuild` (interface) for convention.
 */

import { WpBuildLogTrueColor } from "./log";
import WpBuildRc from "./.wpbuildrc.defaults.json";
import { ConvertType, ConvertType2, ConvertType3, PartialSome } from "./generic";


// declare type WpBuildPluginTapOptionsCallbackType<T> = T extends ReturnType<IWpBuildPluginTapOptions["callback"]> ? X : never;
// declare type WpBuildPluginTapOptionsCallbackType2 = ReturnType<IWpBuildPluginTapOptions["callback"]>;
// declare type WpBuildPluginTapOptionsCallbackType3<T> = T extends WpBuildPluginTapOptionsCallbackType2<infer X> ? X : never;
// interface IWpBuildPluginTapOptions2
// {
//     async?: boolean;
//     hook: WebpackCompilerHookName;
//     hookCompilation?: WebpackCompilationHookName;
//     callback: (arg: WebpackCompiler | WebpackCompilationAssets | WebpackCompilationParams) => void | Promise<void>;
//     stage?: WebpackCompilationHookStage;
//     statsProperty?: string;
// }
/**
 * Defined types for this module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */

declare type WpBuildRcBuilds = typeof WpBuildRc.builds;
declare type WpBuildRcBuild = ConvertType3<ConvertType3<ConvertType3<ConvertType3<typeof WpBuildRc.builds.dev[0], "build", WpBuildModule>, "environment", WpBuildEnvironment>, "mode", WebpackMode>, "target", WebpackTarget>;
declare type WpBuildRcBuildSet = WpBuildRcBuild[];
declare type WpBuildRcEnvironment = typeof WpBuildRc.environment;
declare type WpBuildRcExports =  typeof WpBuildRc.exports;
declare type WpBuildRcLog= typeof WpBuildRc.log;
declare type WpBuildRcLogColors = typeof WpBuildRc.colors;
declare type WpBuildRcLogColorsBuild = typeof WpBuildRc.colors.builds;
declare type WpBuildRcModules= typeof WpBuildRc.modules;
declare type WpBuildRcPaths = typeof WpBuildRc.paths;
declare type WpBuildRcPlugins = typeof WpBuildRc.plugins;
declare type WpBuildRcVsCode= typeof WpBuildRc.vscode;
declare type WpBuildRcLogColorBuilds = ConvertType<WpBuildRcLogColorsBuild, string, WpBuildLogTrueColor>;
declare type WpBuildRcLogColorMap = ConvertType2<WpBuildRcLogColors & { builds: WpBuildRcLogColorBuilds }, string, WpBuildLogTrueColor, WpBuildRcLogColorsBuild, WpBuildRcLogColorBuilds>;

declare interface IWpBuildPackageJson
{
    author?: string | { name: string, email?: string };
    description: string;
    displayName: string; 
    main: string;
    module: boolean;
    name: string;
    publisher: string;
    version: string;
}
declare type WpBuildRcPackageJson = IWpBuildPackageJson & Record<string, any>;

// declare type WpBuildModule = PartialSome<typeof WpBuildRc.builds.dev[0], "environment" | "mode" | "target">;
declare type WpBuildModule = keyof WpBuildRcModules;
declare type WpBuildEnvironment= keyof WpBuildRcEnvironment;
declare type WpBuildRcExport = Exclude<keyof WpBuildRcExports, "index">;
declare type WpBuildRcPlugin = Exclude<keyof WpBuildRcPlugins, "index">;

declare interface IWpBuildRc
{
    bannerName: string;                   // Displayed in startup banner detail line
    bannerNameDetailed: string;           // Displayed in startup banner detail line
    builds: WpBuildRcBuilds;
    colors: WpBuildRcLogColorMap;
    displayName: string;                  // displayName (read from package.json)
    exports: WpBuildRcExports;
    publicInfoProject: boolean | string;  // Project w/ private repo that maintains a public `info` project
    log: WpBuildRcLog;
    name: string;                         // project name (read from package.json)
    paths: WpBuildRcPaths;
    pkgJson: WpBuildRcPackageJson;
    plugins: WpBuildRcPlugins;
    version: string;                      // app version (read from package.json)
    vscode: WpBuildRcVsCode
}
declare type WpBuildRc = IWpBuildRc;

// declare type ModuleName = ExtractValue<WpBuildRc, "name">["name"];


export {
    IWpBuildRc,
    WpBuildEnvironment,
    WpBuildModule,
    WpBuildRc,
    WpBuildRcBuild,
    WpBuildRcBuilds,
    WpBuildRcBuildSet,
    WpBuildRcExport,
    WpBuildRcExports,
    WpBuildRcLog,
    WpBuildRcLogColorMap,
    WpBuildRcPackageJson,
    WpBuildRcPaths,
    WpBuildRcPlugin,
    WpBuildRcPlugins,
    WpBuildRcVsCode
};

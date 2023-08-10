
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
 * Defined types for internal WpBuild module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */

import { WpBuildLogTrueColor } from "./logger";
import WpBuildRcDefault from "./.wpbuildrc.defaults.json";
import { ConvertType, ConvertType2, ConvertType3, IDisposable } from "./generic";


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

declare type WpBuildRcBuild = { build: WpBuildModule; environment: WpBuildEnvironment; mode: WebpackMode; target: WebpackTarget; };
declare type WpBuildRcBuildSet = WpBuildRcBuild[];
declare type WpBuildRcBuilds =  ConvertType3<typeof WpBuildRcDefault.builds, WpBuildEnvironment, WpBuildRcBuildSet>;
declare type WpBuildRcEnvironment = typeof WpBuildRcDefault.environment;
declare type WpBuildRcExports =  typeof WpBuildRcDefault.exports;
declare type WpBuildRcLog= typeof WpBuildRcDefault.log;
declare type WpBuildRcLogColors = typeof WpBuildRcDefault.colors;
declare type WpBuildRcLogColorsBuild = typeof WpBuildRcDefault.colors.builds;
declare type WpBuildRcModules= typeof WpBuildRcDefault.modules;
declare type WpBuildRcPaths = typeof WpBuildRcDefault.paths;
declare type WpBuildRcPlugins = typeof WpBuildRcDefault.plugins;
declare type WpBuildRcVsCode= typeof WpBuildRcDefault.vscode;
declare type WpBuildRcLogColorBuilds = ConvertType<WpBuildRcLogColorsBuild, string, WpBuildLogTrueColor>;
declare type WpBuildRcLogColorMap = ConvertType2<WpBuildRcLogColors & { builds: WpBuildRcLogColorBuilds }, string, WpBuildLogTrueColor, WpBuildRcLogColorsBuild, WpBuildRcLogColorBuilds>;

declare type WpBuildRcPackageJson = {
    author?: string | { name: string, email?: string };
    description: string;
    displayName: string; 
    main: string;
    module: boolean;
    name: string;
    publisher: string;
    version: string;
};

// declare type WpBuildModule = PartialSome<typeof WpBuildRcDefault.builds.dev[0], "environment" | "mode" | "target">;
// declare type WpBuildMainModule = ExtractValue<WpBuildRc, "name">["name"];
declare type WpBuildModule = keyof WpBuildRcModules;
declare type WpBuildEnvironment= keyof WpBuildRcEnvironment;
declare type WpBuildRcExport = keyof WpBuildRcExports;
declare type WpBuildRcPlugin = keyof WpBuildRcPlugins;

declare class WpBuildRc implements IDisposable
{
    constructor();
    builds: WpBuildRcBuilds;
    colors: WpBuildRcLogColorMap;
    detailedDisplayName: string;           // Displayed in startup banner detail line
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
};


export {
    WpBuildRc,
    WpBuildEnvironment,
    WpBuildModule,
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

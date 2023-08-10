
/**
 * @file types/app.d.ts
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

import { IDisposable } from "./generic";
import { WpBuildRc, WpBuildEnvironment, WpBuildModule, WpBuildRcPaths } from "./wpbuild";
import {
    WebpackConfig, WebpackEntry, WebpackLogLevel, WebpackOutput, WebpackRuntimeArgs, WebpackRuntimeEnvArgs,
    WebpackTarget, WebpackMode
} from "./webpack"


declare type WpBuildConfig = {
    mode: WebpackMode;
    entry: WebpackEntry;
    output: WebpackOutput;
};
declare type WpBuildWebpackConfig = Omit<WebpackConfig, WpBuildConfig> & WpBuildConfig;

declare type WpBuildRuntimeEnvArgs =
{
    build: WpBuildModule;
    environment: WpBuildEnvironment;
    mode: WebpackMode;
} & WebpackRuntimeEnvArgs;

declare interface IWpBuildGlobalEnvironment
{
    buildCount: number;
    cache: Record<string, any>;
    cacheDir: string;
    verbose: boolean;
}
declare type WpBuildGlobalEnvironment = IWpBuildGlobalEnvironment & Record<string, any>;

declare type WpBuildPaths = {
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    temp: string;                         // operating system temp directory
} & WpBuildRcPaths;

declare const __WPBUILD__: WpBuildRuntimeVariables;

declare class WpBuildApp implements IDisposable
{
    analyze: boolean;                     // parform analysis after build
    rc: WpBuildRc;                        // target js app info
    argv: WebpackRuntimeArgs;
    arge: WpBuildRuntimeEnvArgs;
    build: WpBuildModule;
    clean: boolean;
    disposables: Array<Disposable>;
    environment: WpBuildEnvironment;
    esbuild: boolean;                     // Use esbuild and esloader
    imageOpt: boolean;                    // Perform image optimization
    isMain: boolean;
    isMainProd: boolean;
    isMainTests: boolean;
    isTests: boolean;
    isWeb: boolean;
    global: WpBuildGlobalEnvironment;    // Accessible by all parallel builds
    logger: WpBuildConsoleLogger;
    paths: WpBuildPaths;
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
    wpc: WpBuildWebpackConfig;
};


export {
    Disposable,
    WpBuildApp,
    WpBuildExportsFlags,
    WpBuildModule,
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildVsCodeBuild,
    WpBuildWebpackConfig,
    __WPBUILD__
};


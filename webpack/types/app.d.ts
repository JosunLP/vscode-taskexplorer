
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

import { WpBuildConsoleLogger } from "../utils";
import { WpBuildRc, WpBuildEnvironment, WpBuildModule } from "./wpbuild";
import { WebpackConfig, WebpackEntry, WebpackLogLevel, WebpackOutput, WebpackRuntimeArgs, WebpackTarget } from "./webpack"


declare type Disposable = Required<{ dispose: () => void | PromiseLike<void>; }>;

declare interface IWpBuildWebpackConfig extends WebpackConfig
{
    mode: WebpackMode;
    entry: WebpackEntry;
    output: WebpackOutput;
}
declare type WpBuildWebpackConfig = IWpBuildWebpackConfig;

declare interface IWpBuildGlobalEnvironment
{
    buildCount: number;
    cache: Record<string, any>;
    cacheDir: string;
    verbose: boolean;
}
declare type WpBuildGlobalEnvironment = IWpBuildGlobalEnvironment & Record<string, any>;

declare interface IWpBuildPaths
{
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    dist: string;                         // output directory ~ wpConfig.output.path ~ compiler.options.output.path
    distTests: string;                    // output directory ~ wpConfig.output.path ~ compiler.options.output.path
    temp: string;                         // operating system temp directory
}
declare type WpBuildPaths = Required<IWpBuildPaths> & Record<string, any>;

declare interface IWpBuildRuntimeVariables
{
    contentHash: Record<string, string>
}
declare type WpBuildRuntimeVariables = Required<IWpBuildRuntimeVariables>;

declare const __WPBUILD__: WpBuildRuntimeVariables;

declare interface IWpBuildApp
{
    analyze: boolean;                     // parform analysis after build
    rc: WpBuildRc;                      // target js app info
    argv: WebpackRuntimeArgs,
    build: WpBuildModule;
    clean: boolean;
    disposables: Array<Disposable>;
    environment: WpBuildEnvironment;
    esbuild: boolean;                     // Use esbuild and esloader
    imageOpt: boolean;                    // Perform image optimization
    isMain: boolean;
    isMainProd: boolean,
    isMainTests: boolean;
    isTests: boolean;
    isWeb: boolean;
    global: WpBuildGlobalEnvironment;    // Accessible by all parallel builds
    logger: WpBuildConsoleLogger;
    paths: WpBuildPaths;
    preRelease: boolean;
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
    wpc: WpBuildWebpackConfig;
}
declare type WpBuildApp = IWpBuildApp;


export {
    Disposable,
    IWpBuildApp,
    WpBuildApp,
    WpBuildExportsFlags,
    WpBuildModule,
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeVariables,
    WpBuildVsCodeBuild,
    WpBuildWebpackConfig,
    __WPBUILD__
};


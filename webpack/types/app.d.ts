
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
 * Provides types to interface the base `app` runtime instances of each build.
 *
 * All types exported from this definition file are prepended with `WpBuildPlugin`.
 */

import { WpBuildEnvironment, WpBuildRcPaths, WpBuildWebpackEntry } from "./rc";
import {
    WebpackConfig, WebpackOutput, WebpackRuntimeEnvArgs, WebpackTarget, WebpackMode, WebpackModuleOptions
} from "./webpack";

// declare type WpBuildConfig = {
declare type WpBuildWebpackConfig = {
    mode: WebpackMode;
    entry: WpBuildWebpackEntry;
    output: WebpackOutput;
    target: WebpackTarget;
    module: WebpackModuleOptions;
} & WebpackConfig;
// declare type WpBuildWebpackConfig = Omit<WebpackConfig, WpBuildConfig> & WpBuildConfig;

declare interface WpBuildRuntimeEnvArgs extends WebpackRuntimeEnvArgs
{
    build: WpBuildBuild;
    environment: WpBuildEnvironment;
    mode: WpBuildWebpackMode;
};

declare interface WpBuildGlobalEnvironment extends Record<string, any>
{
    buildCount: number;
    cache: Record<string, any>;
    cacheDir: string;
    verbose: boolean;
};

declare interface WpBuildPaths extends WpBuildRcPaths
{
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    temp: string;                         // operating system temp directory
};

declare const __WPBUILD__: any;

// declare interface IWpBuildApp
// {
//     analyze: boolean;                     // parform analysis after build
//     rc: IWpBuildRc;                        // target js app info
//     argv: WebpackRuntimeArgs;
//     arge: WpBuildRuntimeEnvArgs;
//     build: WpBuildModule;
//     clean: boolean;
//     disposables: Array<IDisposable>;
//     environment: WpBuildEnvironment;
//     esbuild: boolean;                     // Use esbuild and esloader
//     imageOpt: boolean;                    // Perform image optimization
//     isMain: boolean;
//     isMainProd: boolean;
//     isMainTests: boolean;
//     isTests: boolean;
//     isWeb: boolean;
//     global: WpBuildGlobalEnvironment;    // Accessible by all parallel builds
//     logger: WpBuildConsoleLogger;
//     paths: WpBuildPaths;
//     target: WebpackTarget;
//     verbosity: WebpackLogLevel;
//     wpc: WpBuildWebpackConfig;
// };

export {
    WpBuildBuild,
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildWebpackConfig,
    __WPBUILD__
};

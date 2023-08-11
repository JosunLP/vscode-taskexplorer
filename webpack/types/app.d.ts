
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
 * Defined types for internal WpBuild module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */

import { WpBuildEnvironment, WpBuildBuild, WpBuildRcPaths } from "./rc";
import {
    WebpackConfig, WebpackEntry, WebpackOutput, WebpackRuntimeEnvArgs, WebpackTarget,
    WebpackMode, WebpackModuleOptions
} from "./webpack";

// declare type WpBuildConfig = {
declare type WpBuildWebpackConfig = {
    mode: WebpackMode;
    entry: WebpackEntry;
    output: WebpackOutput;
    target: WebpackTarget;
    module: WebpackModuleOptions;
} & WebpackConfig;
// declare type WpBuildWebpackConfig = Omit<WebpackConfig, WpBuildConfig> & WpBuildConfig;

declare type WpBuildRuntimeEnvArgs =
{
    build: WpBuildBuild;
    environment: WpBuildEnvironment;
    mode: WebpackMode;
} & WebpackRuntimeEnvArgs;

declare type WpBuildGlobalEnvironment = {
    buildCount: number;
    cache: Record<string, any>;
    cacheDir: string;
    verbose: boolean;
} & Record<string, any>;

declare type WpBuildPaths = {
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    temp: string;                         // operating system temp directory
} & WpBuildRcPaths;

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
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildWebpackConfig,
    __WPBUILD__
};

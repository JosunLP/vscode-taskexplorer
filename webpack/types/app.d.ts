
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

import { IDisposable } from "./generic";
import {
    WebpackConfig, WebpackOutput, WebpackRuntimeEnvArgs, WebpackTarget, WebpackMode, WebpackModuleOptions
} from "./webpack";
import {
    IWpBuildRcSchema, WpBuildRcPaths, WpBuildWebpackEntry, WpBuildWebpackMode, WpBuildRcBuildType, WpBuildRcBuild
} from "./rc";


declare const __WPBUILD__: any;

declare type WpBuildRcPathsExt = { base: string; build: string; temp: string; } & WpBuildRcPaths;

declare type WpBuildGlobalEnvironment = { buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any };

declare type WpBuildRuntimeEnvArgs = { /** @deprecated Use `name`*/build?: string; mode?: WpBuildWebpackMode; name?: string; type?: WpBuildRcBuildType; } & WebpackRuntimeEnvArgs;

declare type WpBuildWebpackConfig = {
    mode: WebpackMode; entry: WpBuildWebpackEntry; output: WebpackOutput; target: WebpackTarget; module: WebpackModuleOptions;
} & WebpackConfig;

declare class WpBuildAppType
{
    analyze: boolean;                 // parform analysis after build
    arge: WpBuildRuntimeEnvArgs;
    argv: WebpackRuntimeArgs;
    build: WpBuildRcBuild;
    clean: boolean;
    disposables: Array<IDisposable>;
    esbuild: boolean;                 // Use esbuild and esloader
    imageOpt: boolean;                // Perform image optimization
    isMain: boolean;
    isMainProd: boolean;
    isMainTests: boolean;
    isTests: boolean;
    isWeb: boolean;
    global: WpBuildGlobalEnvironment; // Accessible by all parallel builds
    logger: WpBuildConsoleLogger;
    paths: WpBuildRcPathsExt;
    rc: IWpBuildRcSchemaExt;           // target js app info
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
    wpc: WpBuildWebpackConfig;
    mode: WpBuildWebpackMode;
    dispose: () => void;
    private wpApp;
    private getPaths;
    private resolveRcPaths;
};

export {
    WpBuildAppType,
    WpBuildRcPathsExt,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildWebpackConfig,
    __WPBUILD__
};

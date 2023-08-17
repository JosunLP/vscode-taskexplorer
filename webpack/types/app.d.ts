
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
import { IWpBuildLogger } from "./logger";
import {
    WpBuildRcPaths, WpBuildWebpackEntry, WpBuildWebpackMode, WpBuildRcBuildType, WpBuildRcBuild, WebpackTarget, WpBuildRcEnvironment, IWpBuildRcSchema, WpBuildRcPathsKey
} from "./rc";
import {
    WebpackConfig, WebpackEntry, WebpackModuleOptions, WebpackLogLevel
} from "./webpack";


declare const __WPBUILD__: any;

declare type WpBuildAppGetPathOptions = { rel?: boolean; ctx?: boolean; dot?: boolean; psx?: boolean; stat?: boolean; fstat?: boolean; path?: string };

declare type WpBuildGlobalEnvironment = { buildCount: number; cache: Record<string, any>; cacheDir: string; verbose: boolean; [ key: string ]: any };

declare type WpBuildRuntimeEnvArgs =  { /** @deprecated Use `name`*/build?: string; mode?: WpBuildWebpackMode; name?: string; type?: WpBuildRcBuildType; verbosity?: WebpackLogLevel };

declare type WpBuildRcEnvironmentBase = Omit<WpBuildRcEnvironment, "builds">;

declare type WpBuildCombinedRuntimeArgs = WebpackRuntimeArgs & WebpackRuntimeEnvArgs & WpBuildRuntimeEnvArgs;

declare interface IWpBuildWebpackConfig extends WebpackConfig
{
    mode: Exclude<WebpackConfig["mode"], undefined>;
    entry: WpBuildWebpackEntry | WebpackEntry;
    output: Exclude<WebpackConfig["output"], undefined>;
    target: WebpackTarget;
    module: WebpackModuleOptions;
};
declare type WpBuildWebpackConfig = IWpBuildWebpackConfig;

declare type WpBuildAppTsConfig = { raw: string; json: Record<string, any>; include: string[]; path: string };

declare interface IWpBuildApp
{
    build: WpBuildRcBuild;
    global: WpBuildGlobalEnvironment; // Accessible by all parallel builds
    logger: IWpBuildLogger;
    rc: IWpBuildRcSchema;          // target js app info
    target: WebpackTarget;
    tsConfig: WpBuildAppTsConfig | undefined;
    wpc: WpBuildWebpackConfig;
}

declare class ClsWpBuildApp
{
    analyze: boolean;                 // parform analysis after build
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
    logger: IWpBuildLogger;
    paths: WpBuildRcPaths;
    rc: IWpBuildRcSchema;           // target js app info
    target: WebpackTarget;
    wpc: WpBuildWebpackConfig;
    mode: WpBuildWebpackMode;
    dispose: () => void;
    private wpApp;
    private getPaths;
    private resolveRcPaths;
}

export {
    ClsWpBuildApp,
    IWpBuildApp,
    WpBuildCombinedRuntimeArgs,
    WpBuildRcEnvironmentBase,
    WpBuildAppGetPathOptions,
    WpBuildGlobalEnvironment,
    WpBuildRuntimeEnvArgs,
    WpBuildAppTsConfig,
    WpBuildWebpackConfig,
    __WPBUILD__
};

/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

declare type WebpackAsset = import("webpack").Asset;
declare type WebpackAssetInfo = import("webpack").AssetInfo;
declare type WebpackAssetEmittedInfo = import("webpack").AssetEmittedInfo;
declare type WebpackCache = import("webpack").Cache;
declare type WebpackCacheFacade = Omit<import("webpack/lib/CacheFacade"), "_name" | "_cache" | "_hashFunction">;
declare type WebpackChunk = import("webpack").Chunk;
declare type WebpackCompilation = import("webpack").Compilation;
declare type WebpackCompilationAssets = { [index: string]: WebpackSource; }
declare type WebpackCompiler = import("webpack").Compiler;
declare type WebpackConfig = Required<import("webpack").Configuration>;
declare type WebpackLogger = import("webpack/lib/logging/Logger").Logger;
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;
declare type WebpackSource = import("webpack").sources.Source;
declare type WebpackStatsAsset = import("webpack").StatsAsset;
declare type WebpackSyncHook<T> = import("tapable").SyncHook<T>;
declare type WebpackAsyncHook<T> = import("tapable").AsyncSeriesHook<T>;

declare type WebpackTarget = "webworker" | "node" | "web";
declare type WebpackMode = "none" | "development" | "production";
declare type WebpackBuildEnvironment= "dev" | "prod" | "test" | "testprod";
declare type WebpackLogLevel = "none" | "error" | "warn" | "info" | "log" | "verbose" | undefined;

declare type WpBuildModule = "browser" | "common" | "extension" | "tests" | "webview";

declare interface IWpBuildRuntimeVariables
{
    contentHash: Record<string, string>
}
declare type WpBuildRuntimeVariables = Required<IWpBuildRuntimeVariables>;

declare const __WPBUILD__: WpBuildRuntimeVariables;

declare interface IWpBuildEnvironment extends WebpackEnvironmentInternal
{
    analyze: boolean;                     // parform analysis after build
    app: WpBuildApp;                      // target js app info
    argv: WpBuildWebpackArgs,
    build: WpBuildModule;
    clean: boolean;
    environment: WebpackBuildEnvironment;
    esbuild: boolean;                     // Use esbuild and esloader
    imageOpt: boolean;                    // Perform image optimization
    isExtension: boolean;
    isExtensionProd: boolean,
    isExtensionTests: boolean;
    isTests: boolean;
    isWeb: boolean;
    paths: WpBuildPaths;
    preRelease: boolean;
    state: WebpackBuildState;
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
}
declare type WpBuildEnvironment = Required<IWpBuildEnvironment>;

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
declare type WpBuildPackageJson = IWpBuildPackageJson & Record<string, any>;

declare interface IWpBuildGlobalEnvironment
{
    buildCount: number;
    cache: Record<string, any>;
    cacheDir: string;
    pkgJson: WpBuildPackageJson; 
    valuePad: number;
}
declare type WpBuildGlobalEnvironment = IWpBuildGlobalEnvironment & Record<string, any>;

declare interface IWebpackApp
{
    bannerName: string;                   // Displayed in startup banner detail line
    bannerNameDetailed: string;           // Displayed in startup banner detail line
    displayName: string;                  // displayName (read from package.json)
    exports: Record<string, boolean>;
    publicInfoProject: boolean | string;  // Project w/ private repo that maintains a public `info` project
    logPad: Record<string, any>;
    name: string;                         // project name (read from package.json)
    pkgJson: WpBuildPackageJson;
    plugins: Record<string, boolean>;
    version: string;                      // app version (read from package.json)
    vscode: WebpackVsCodeBuild
}
declare type WpBuildApp = IWebpackApp & Record<string, any>;

declare interface IWebpackBuildFilePaths
{
    hash: string;
    sourceMapWasm: string;
}
declare type WebpackBuildFilePaths = Required<IWebpackBuildFilePaths> & Record<string, any>;

declare interface IWebpackVsCodeBuild
{
    webview: {
        baseDIr: string;
        apps: Record<string, string>;     // in key/value for of `webviewsapp: "path/to/entry"`
    }
}
declare type WebpackVsCodeBuild = IWebpackVsCodeBuild & Record<string, any>;

declare interface IWpBuildPaths
{
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    cache: string;
    dist: string;                         // output directory ~ wpConfig.output.path ~ compiler.options.output.path
    distBuild: string;                    // distribution path - release/debug mode specific
    files: WebpackBuildFilePaths;
    temp: string;                         // operating system temp directory
}
declare type WpBuildPaths = Required<IWpBuildPaths> & Record<string, any>;

declare interface IWpBuildHashState
{
    current: Record<string, string>;   // Content hash from last output chunks
    next: Record<string, string>;      // Content hash for new output chunk
    previous: Record<string, string>;  // Content hash from previous build's output chunks (prior to `current`)
}
declare type WpBuildHashState = Required<IWpBuildHashState>;

declare interface IWebpackBuildState
{
    hash: WpBuildHashState;
}
declare type WebpackBuildState = IWebpackBuildState & Record<string, any>;

declare interface IWebpackEnvironmentInternal
{
    WEBPACK_WATCH: boolean;
}
declare type WebpackEnvironmentInternal = Partial<IWebpackEnvironmentInternal>;

declare interface IWpBuildWebpackArgs
{
    config: string[];
    env: WpBuildEnvironment;
    mode: WebpackMode;
    watch: boolean;
}
declare type WpBuildWebpackArgs = Readonly<Partial<IWpBuildWebpackArgs>>;

interface IWpBuildPluginOptions
{
    env: WpBuildEnvironment,
    wpConfig: WebpackConfig,
}
declare type WpBuildPluginOptions = Readonly<IWpBuildPluginOptions> & Record<string, any>;


declare type WpBuildPluginCompilationHookStage = "ADDITIONAL" | "PRE_PROCESS" | "DERIVED" | "ADDITIONS" |  "OPTIMIZE" |
                                                 "OPTIMIZE_COUNT" | "OPTIMIZE_COMPATIBILITY" | "OPTIMIZE_SIZE" |
                                                 "DEV_TOOLING" | "OPTIMIZE_INLINE" | "SUMMARIZE" | "OPTIMIZE_HASH" |
                                                 "OPTIMIZE_TRANSFER" | "ANALYSE" | "REPORT"
interface IWpBuildPluginTapOptions
{
    async?: boolean;
    hook: string | "compilation";
    callback: ((assets: WebpackCompilationAssets) => void | Promise<void>) | ((compiler: WebpackCompiler) => void | Promise<void>);
    stage?: WpBuildPluginCompilationHookStage;
    statsProperty?: string;
}
declare type WpBuildPluginApplyOptions = Readonly<IWpBuildPluginTapOptions>
declare type WpBuildPluginTapOptions = Readonly<IWpBuildPluginTapOptions>
declare type WpBuildPluginApplyOptionsHash = Record<string, IWpBuildPluginTapOptions>
declare type WpBuildPluginTapOptionsHash  = Record<string, IWpBuildPluginTapOptions>

export {
    WebpackAsset,
    WebpackAssetInfo,
    WebpackAssetEmittedInfo,
    WebpackAsyncHook,
    WebpackSyncHook,
    WebpackBuildState,
    WebpackCache,
    WebpackCacheFacade,
    WebpackChunk,
    WebpackCompiler,
    WebpackCompilation,
    WebpackCompilationAssets,
    WebpackConfig,
    WebpackLogger,
    WebpackMode,
    WebpackPluginInstance,
    WpBuildEnvironment,
    WebpackLogLevel,
    WebpackSource,
    WebpackStatsAsset,
    WebpackTarget,
    WebpackBuildEnvironment,
    WebpackVsCodeBuild,
    WpBuildApp,
    WpBuildModule,
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildHashState,
    WpBuildPackageJson,
    WpBuildPluginOptions,
    WpBuildPluginApplyOptions,
    WpBuildPluginApplyOptionsHash,
    WpBuildPluginCompilationHookStage,
    WpBuildPluginTapOptions,
    WpBuildPluginTapOptionsHash,
    WpBuildRuntimeVariables,
    WpBuildWebpackArgs,
    __WPBUILD__
};

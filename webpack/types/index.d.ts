/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

declare type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * Webpack library types are prefixed with `Webpack` for convention.
 */
declare type WebpackAsset = import("webpack").Asset;
declare type WebpackAssetInfo = import("webpack").AssetInfo;
declare type WebpackAssetEmittedInfo = import("webpack").AssetEmittedInfo;
declare type WebpackAsyncHook<T> = import("tapable").AsyncSeriesHook<T>;
declare type WebpackCache = import("webpack").Cache;
declare type WebpackCacheFacade = ReturnType<WebpackCompilation["getCache"]>;
declare type WebpackChunk = import("webpack").Chunk;
declare type WebpackCompilation = import("webpack").Compilation;
// declare type WebpackNormalModuleFactory = import("webpack").NormalModuleFactory;
// declare type WebpackContextModuleFactoryy = import("webpack").Compilation.ContextModuleFactory;
declare type WebpackCompilationAssets = { [index: string]: WebpackSource; }
declare type WebpackCompilationHook = WebpackCompilation["hooks"];
declare type WebpackCompilationHookName = keyof WebpackCompilationHook;
declare type WebpackCompilationHookStage = "ADDITIONAL" | "PRE_PROCESS" | "DERIVED" | "ADDITIONS" |  "OPTIMIZE" |
                                           "OPTIMIZE_COUNT" | "OPTIMIZE_COMPATIBILITY" | "OPTIMIZE_SIZE" |
                                           "DEV_TOOLING" | "OPTIMIZE_INLINE" | "SUMMARIZE" | "OPTIMIZE_HASH" |
                                           "OPTIMIZE_TRANSFER" | "ANALYSE" | "REPORT"
declare type WebpackCompiler = import("webpack").Compiler;
declare type WebpackCompilerHookName = keyof WebpackCompiler["hooks"];
declare type WebpackConfig = Required<import("webpack").Configuration>;
declare type WebpackEtag = ReturnType<ReturnType<WebpackCompilation["getCache"]>["getLazyHashedEtag"]>;
declare type WebpackHookMap<H> = import("tapable").HookMap<H>;
declare type WebpackLogger = ReturnType<WebpackCompilation["getLogger"]>;
declare type WebpackLogLevel = "none" | "error" | "warn" | "info" | "log" | "verbose" | undefined;
declare type WebpackMode = "none" | "development" | "production";
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;
declare type WebpackRawSource = import("webpack").sources.RawSource;
declare type WebpackSchema = import("schema-utils/declarations/validate").Schema;
declare type WebpackSource = import("webpack").sources.Source;
declare type WebpackSnapshot = ReturnType<WebpackCompilation["fileSystemInfo"]["mergeSnapshots"]>;
declare type WebpackStats = import("webpack").Stats;
declare type WebpackStatsAsset = import("webpack").StatsAsset;
declare type WebpackStatsPrinterHook =  WebpackCompilationHook["statsPrinter"];
declare type WebpackStatsPrinterType<T> = T extends WebpackSyncHook<infer X> ? X : never;
declare type WebpackStatsPrinter = WebpackStatsPrinterType<WebpackStatsPrinterHook>[0];
declare type WebpackStatsPrinterPrintHookMap = WebpackStatsPrinterType<WebpackStatsPrinterHook>[0]["hooks"]["print"];
declare type WebpackStatsPrinterPrint<T> =  T extends WebpackHookMap<infer X> ? X : never;
declare type WebpackStatsPrinterContextHook<T, Y> =  T extends WebpackSyncBailHook<infer X, Y> ? X : never;
declare type WebpackStatsPrinterPrintBailHook =  WebpackStatsPrinterPrint<WebpackStatsPrinterPrintHookMap>;
declare type WebpackStatsPrinterContext = WebpackStatsPrinterContextHook<WebpackStatsPrinterPrintBailHook, string>[1];
declare type WebpackSyncHook<T> = import("tapable").SyncHook<T>;
declare type WebpackSyncBailHook<T, R> = import("tapable").SyncBailHook<T, R>;
declare type WebpackTarget = "webworker" | "node" | "web";
declare interface WebpackCompilationParams {
	normalModuleFactory: any; // WebpackNormalModuleFactory;
	contextModuleFactory: any; // WebpackContextModuleFactoryy;
}

/**
 * End Webpack library types.
 * 
 * Defined types for this module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */

declare type WpBuildBuildEnvironment= "dev" | "prod" | "test" | "testprod";
declare type WpBuildConsoleLogger = import("../utils").WpBuildConsoleLogger;
declare type WpBuildModule = "web" | "common" | "extension" | "tests" | "types" | "webview";
declare type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;

declare interface IWpBuildRuntimeVariables
{
    contentHash: Record<string, string>
}
declare type WpBuildRuntimeVariables = Required<IWpBuildRuntimeVariables>;

declare const __WPBUILD__: WpBuildRuntimeVariables;

declare interface IWpBuildWebpackConfig extends WebpackConfig
{
    mode: WebpackMode;
}
declare type WpBuildWebpackConfig = Required<IWpBuildWebpackConfig>;

declare type Disposable = Required<{ dispose: () => void | PromiseLike<void>; }>;

declare interface IWpBuildEnvironment extends IWebpackEnvironmentInternal
{
    analyze: boolean;                     // parform analysis after build
    app: WpBuildAppRc;                    // target js app info
    argv: WpBuildWebpackArgs,
    build: WpBuildModule;
    clean: boolean;
    disposables: Array<Disposable>;
    environment: WpBuildBuildEnvironment;
    esbuild: boolean;                     // Use esbuild and esloader
    imageOpt: boolean;                    // Perform image optimization
    isMain: boolean;
    isExtensionProd: boolean,
    isExtensionTests: boolean;
    isTests: boolean;
    isWeb: boolean;
    global: WpBuildGlobalEnvironment;
    logger: WpBuildConsoleLogger;
    logLevel: WpBuildLogLevel;
    paths: WpBuildPaths;
    preRelease: boolean;
    state: WebpackBuildState;
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
    wpc: WpBuildWebpackConfig;
}
declare type WpBuildEnvironment = IWpBuildEnvironment;

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
    verbose: boolean;
}
declare type WpBuildGlobalEnvironment = IWpBuildGlobalEnvironment & Record<string, any>;

declare type WpBuildLogTrueColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow";
declare type WpBuildLogColor = WpBuildLogTrueColor | "bold" | "inverse" | "italic" | "underline";
declare interface IWpBuildLogColorMap
{
    default: WpBuildLogTrueColor;
    buildBracket: WpBuildLogTrueColor,
    buildText: WpBuildLogTrueColor,
    infoIcon: WpBuildLogTrueColor,
    tagBracket: WpBuildLogTrueColor;
    tagText: WpBuildLogTrueColor;
    uploadSymbol: WpBuildLogTrueColor;
    valueStar: WpBuildLogTrueColor;
    valueStarText: WpBuildLogTrueColor;
}
declare type WpBuildLogColorMap = Required<IWpBuildLogColorMap>;
declare interface IWpBuildLogPadMap
{
    base: number;
    envTag: number;
    value: number;
    uploadFileName: number;
}
declare type WpBuildLogPadMap = Required<IWpBuildLogPadMap>;
declare interface IWpBuildLogOptions
{
    level: WpBuildLogLevel;
    pad: WpBuildLogPadMap;
}
declare type WpBuildLogOptions = Required<IWpBuildLogOptions>;
declare type WpBuildModuleConfig = Record<WpBuildBuildEnvironment, Partial<WpBuildEnvironment>[]>;

declare interface IWpBuildLogIconBaseSet
{
    bullet: string;
    error: string;
    info: string;
    star: string;
    start: string;
    success: string;
    up: string;
    warning: string;
}
declare type WpBuildLogIconBlueSet= Pick<IWpBuildLogIconBaseSet, "error"|"info"|"success"|"warning">;
declare interface IWpBuildLogIconActionSet extends IWpBuildLogIconBaseSet
{
    errorTag: string;
    starCyan: string;
    successTag: string;
}
declare type WpBuildLogIconActionSet = IWpBuildLogIconActionSet;
declare interface IWpBuildLogIconSet extends IWpBuildLogIconBaseSet
{
    blue: WpBuildLogIconBlueSet;
    color: WpBuildLogIconActionSet;
}
declare type WpBuildLogIconSet = Required<IWpBuildLogIconSet>;
declare type WpBuildLogIcon = keyof Omit<WpBuildLogIconSet, "blue" | "color">;

declare interface IWpBuildApp
{
    rc: WpBuildAppRc;
}
declare type WpBuildApp = Required<IWpBuildApp>;

declare interface IWpBuildAppRc
{
    bannerName: string;                   // Displayed in startup banner detail line
    bannerNameDetailed: string;           // Displayed in startup banner detail line
    builds: WpBuildModuleConfig;
    colors: WpBuildLogColorMap;
    displayName: string;                  // displayName (read from package.json)
    exports: Record<string, boolean>;
    publicInfoProject: boolean | string;  // Project w/ private repo that maintains a public `info` project
    logLevel: WpBuildLogLevel;
    log: WpBuildLogOptions;
    name: string;                         // project name (read from package.json)
    pkgJson: WpBuildPackageJson;
    plugins: Record<string, boolean>;
    version: string;                      // app version (read from package.json)
    vscode: WebpackVsCodeBuild
}
declare type WpBuildAppRc = IWpBuildAppRc & Record<string, any>;

declare interface IWebpackBuildFilePaths
{
    hashStoreJson: string;
    sourceMapWasm: string;
}
declare type WebpackBuildFilePaths = Required<IWebpackBuildFilePaths> & Record<string, any>;

declare interface IWebpackVsCodeBuild
{
    webview: {
        baseDir: string;
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
    distTests: string;                    // output directory ~ wpConfig.output.path ~ compiler.options.output.path
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

declare interface IWpBuildWebpackArgs
{
    config: string[];
    env: WpBuildEnvironment;
    mode: WebpackMode;
    watch: boolean;
}
declare type WpBuildWebpackArgs = Readonly<Partial<IWpBuildWebpackArgs>>;

interface IWpBuildPluginVendorOptions
{
    ctor: new(...args: any[]) => WebpackPluginInstance,
    options: Readonly<Record<string, any>>
}
declare type WpBuildPluginVendorOptions = Readonly<IWpBuildPluginVendorOptions> & Record<string, any>;

interface IWpBuildPluginOptions
{
    env: WpBuildEnvironment,
    plugins?: WpBuildPluginVendorOptions | WpBuildPluginVendorOptions[],
    registerVendorPluginsFirst?: boolean;
}
declare type WpBuildPluginOptions = IWpBuildPluginOptions & Record<string, any>;

interface IWpBuildCacheOptions
{
    file: string;
}
declare type WpBuildCacheOptions = IWpBuildCacheOptions & Record<string, any>;

interface IWpBuildPluginTapOptions
{
    async?: boolean;
    hook: WebpackCompilerHookName;
    hookCompilation?: WebpackCompilationHookName;
    callback: (arg: WebpackCompiler | WebpackCompilationAssets | WebpackCompilationParams) => void | Promise<void>;
    stage?: WebpackCompilationHookStage;
    statsProperty?: string;
}
declare type WpBuildPluginTapOptions = Readonly<Omit<IWpBuildPluginTapOptions, "hookCompilation">> & Pick<IWpBuildPluginTapOptions, "hookCompilation">;
declare type WpBuildPluginTapOptionsHash  = Record<string, WpBuildPluginTapOptions>

export {
    RequireKeys,
    WebpackAsset,
    WebpackAssetInfo,
    WebpackAssetEmittedInfo,
    WebpackAsyncHook,
    WebpackSyncHook,
    WebpackBuildState,
    WebpackCache,
    WebpackCacheFacade,
    WebpackChunk,
    WebpackCompilation,
    WebpackCompilationAssets,
    WebpackCompilationHookName,
    WebpackCompilationHookStage,
    WebpackCompilationParams,
    WebpackCompiler,
    WebpackConfig,
    WebpackEtag,
    WebpackLogger,
    WebpackMode,
    WebpackPluginInstance,
    WpBuildEnvironment,
    WebpackLogLevel,
    WebpackRawSource,
    WebpackSchema,
    WebpackSnapshot,
    WebpackSource,
    WebpackStats,
    WebpackStatsAsset,
    WebpackStatsPrinter,
    WebpackStatsPrinterContext,
    WebpackStatsPrinterHook,
    WebpackTarget,
    WebpackVsCodeBuild,
    WpBuildApp,
    WpBuildAppRc,
    WpBuildBuildEnvironment,
    WpBuildCacheOptions,
    WpBuildModule,
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildHashState,
    WpBuildLogColor,
    WpBuildLogIcon,
    WpBuildLogIconSet,
    WpBuildLogLevel,
    WpBuildLogOptions,
    WpBuildLogTrueColor,
    WpBuildPackageJson,
    WpBuildPluginOptions,
    WpBuildPluginTapOptions,
    WpBuildPluginTapOptionsHash,
    WpBuildPluginVendorOptions,
    WpBuildRuntimeVariables,
    WpBuildWebpackArgs,
    WpBuildWebpackConfig,
    __WPBUILD__
};

// @ts-check

/**
 * @file types/webpack.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 * 
 * Handy file links:
 * 
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 */
import { PickByType } from "./generic";

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
declare type WebpackEntryObject = import("webpack").EntryObject;
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
declare type WebpackCompilerHook = WebpackCompiler["hooks"];
declare type WebpackCompilerHookName = keyof WebpackCompilerHook;
declare type WebpackCompilerAsyncHook = PickByType<WebpackCompilerHook, import("tapable").AsyncSeriesHook<T>>;
declare type WebpackCompilerAsyncHookName = keyof WebpackCompilerAsyncHook;
declare type WebpackCompilerSyncHook = PickByType<WebpackCompilerHook, import("tapable").SyncHook<T>>;
declare type WebpackCompilerSyncHookName = keyof WebpackCompilerSyncHook;
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
    WebpackCompilation,
    WebpackCompilationAssets,
    WebpackCompilationHook,
    WebpackCompilationHookName,
    WebpackCompilationHookStage,
    WebpackCompilationParams,
    WebpackCompiler,
    WebpackCompilerHook,
    WebpackCompilerHookName,
    WebpackCompilerAsyncHook,
    WebpackCompilerAsyncHookName,
    WebpackCompilerSyncHook,
    WebpackCompilerSyncHookName,
    WebpackConfig,
    WebpackEntryObject,
    WebpackEtag,
    WebpackLogger,
    WebpackMode,
    WebpackPluginInstance,
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
    WebpackTarget
};


import { ConvertType, PickByType } from "./generic";
import { AsyncSeriesHook, HookMap, SyncHook, SyncBailHook } from "tapable"
import { Schema as WebpackSchema } from "schema-utils/declarations/validate";
import {
    Asset as WebpackAsset, AssetInfo as WebpackAssetInfo, AssetEmittedInfo as WebpackAssetEmittedInfo,
    Cache as WebpackCache, Chunk as WebpackChunk, Configuration as WebpackConfig, Compilation as WebpackCompilation,
    Compiler as WebpackCompiler, EntryObject as WebpackEntryObject, sources as WebpackSources, Stats as WebpackStats,
    StatsAsset as WebpackStatsAsset, WebpackPluginInstance, ModuleOptions, RuleSetRule, PathData as WebpackPathData
} from "webpack"


declare type WebpackTarget = "webworker" | "node" | "web";
declare type WebpackMode = Exclude<WebpackConfig["mode"], undefined>;
declare type WebpackEntry = Exclude<WebpackConfig["entry"], undefined>;
declare type WebpackOutput = Exclude<WebpackConfig["output"], undefined>;
declare type WebpackLogLevel = Exclude<WebpackConfig["infrastructureLogging"], undefined>["level"];

declare type WebpackRuleSetRule = Exclude<ConvertType<RuleSetRule, (false | "" | 0 | RuleSetRule | "..." | null | undefined)[] , RuleSetRule[]>, undefined>;
declare type WebpackModuleOptions = { rules: WebpackRuleSetRule[]; } & ModuleOptions;

declare type WebpackSource = WebpackSources.Source;
declare type WebpackRawSource = WebpackSources.RawSource;
declare type WebpackSnapshot = ReturnType<WebpackCompilation["fileSystemInfo"]["mergeSnapshots"]>;

// declare type ExtractTypings2<T, V> = T extends V<infer X> ? X : never;
// declare type WebpackStatsPrinterType2<T> = ExtractTypings2<T, WebpackSyncHook>;

declare type WebpackStatsPrinterType<T> = T extends WebpackSyncHook<infer X> ? X : never;
declare type WebpackStatsPrinterPrint<T> =  T extends WebpackHookMap<infer X> ? X : never;
declare type WebpackStatsPrinterContextHook<T, Y> =  T extends WebpackSyncBailHook<infer X, Y> ? X : never;
declare type WebpackStatsPrinterContext = WebpackStatsPrinterContextHook<WebpackStatsPrinterPrint<WebpackStatsPrinterType<WebpackCompilationHook["statsPrinter"]>[0]["hooks"]["print"]>, string>[1];

declare type WebpackAsyncHook<T> = AsyncSeriesHook<T>;
declare type WebpackHookMap<H> = HookMap<H>;
declare type WebpackSyncHook<T> = SyncHook<T>;
declare type WebpackSyncBailHook<T, R> = SyncBailHook<T, R>;

declare type WebpackCompilationAssets = { [index: string]: WebpackSource; }
declare type WebpackCompilationHook = WebpackCompilation["hooks"];
declare type WebpackCacheFacade = ReturnType<WebpackCompilation["getCache"]>;
declare type WebpackLogger = ReturnType<WebpackCompilation["getLogger"]>;
declare type WebpackEtag = ReturnType<ReturnType<WebpackCompilation["getCache"]>["getLazyHashedEtag"]>;

declare type WebpackCompilationHookName = keyof WebpackCompilationHook;
declare interface WebpackCompilationParams {
    normalModuleFactory: any; // WebpackNormalModuleFactory;
    contextModuleFactory: any; // WebpackContextModuleFactoryy;
}
// declare type WebpackNormalModuleFactory = import("webpack").NormalModuleFactory;
// declare type WebpackContextModuleFactoryy = import("webpack").Compilation.ContextModuleFactory;

declare type WebpackCompilationHookStage = "ADDITIONAL" | "PRE_PROCESS" | "DERIVED" | "ADDITIONS" |  "OPTIMIZE" |
                                           "OPTIMIZE_COUNT" | "OPTIMIZE_COMPATIBILITY" | "OPTIMIZE_SIZE" |
                                           "DEV_TOOLING" | "OPTIMIZE_INLINE" | "SUMMARIZE" | "OPTIMIZE_HASH" |
                                           "OPTIMIZE_TRANSFER" | "ANALYSE" | "REPORT"

declare type WebpackCompilerHook = WebpackCompiler["hooks"];
declare type WebpackCompilerAsyncHook = PickByType<WebpackCompilerHook, AsyncSeriesHook<any>>;
declare type WebpackCompilerSyncHook = PickByType<WebpackCompilerHook, SyncHook<any>>;

declare type WebpackCompilerHookName = keyof WebpackCompilerHook;
declare type WebpackCompilerAsyncHookName = keyof WebpackCompilerAsyncHook;
declare type WebpackCompilerSyncHookName = keyof WebpackCompilerSyncHook;

declare type WebpackRuntimeEnvArgs = { WEBPACK_WATCH?: boolean }

declare type WebpackRuntimeArgs = {
    clean?: boolean;
    config: string[];
    env: WebpackRuntimeEnvArgs;
    mode?: WebpackMode;
    watch?: boolean;
} & Record<string, string | boolean | WebpackRuntimeEnvArgs>;


export {
    WebpackRuntimeArgs,
    WebpackRuntimeEnvArgs,
    WebpackAsset,
    WebpackAssetInfo,
    WebpackAssetEmittedInfo,
    WebpackAsyncHook,
    WebpackSyncHook,
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
    WebpackEntry,
    WebpackEntryObject,
    WebpackEtag,
    WebpackLogger,
    WebpackMode,
    WebpackModuleOptions,
    WebpackPathData,
    WebpackPluginInstance,
    WebpackLogLevel,
    WebpackOutput,
    WebpackRawSource,
    WebpackRuleSetRule,
    WebpackSchema,
    WebpackSnapshot,
    WebpackSource,
    WebpackStats,
    WebpackStatsAsset,
    WebpackStatsPrinterContext,
    WebpackTarget
};

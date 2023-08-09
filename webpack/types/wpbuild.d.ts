// @ts-check

/**
 * @file types/wpbuild.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 * 
 * Handy file links:
 * 
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * 
 * WPBUILD APP DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 */

import WpBuildRc from "../.wpbuildrc.json";
import { AsArray, ConvertType, PickByType, RequireKeys } from "./generic";
import {
    WebpackCompilationHookName, WebpackCompilerHookName, WebpackCompiler, WebpackCompilationAssets,
    WebpackCompilationParams, WebpackConfig, WebpackLogLevel
} from "./webpack";

/**
 * Defined types for this module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */

/* wpbuildrc.json */declare type WpBuildModule = keyof typeof WpBuildRc.modules;
/* wpbuildrc.json */declare type WpBuildBuildEnvironment= keyof typeof WpBuildRc.environment;
/* wpbuildrc.json */declare type WpBuildExportName = Exclude<keyof typeof WpBuildRc.exports, "index">;
/* wpbuildrc.json */declare type WpBuildPluginName = Exclude<keyof typeof WpBuildRc.plugins, "index">;

declare type WpBuildConsoleLogger = import("../utils").WpBuildConsoleLogger;
declare type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;
declare type WpBuildLogTrueColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow";
declare type WpBuildLogColor = WpBuildLogTrueColor | "bold" | "inverse" | "italic" | "underline";

// declare type WpBuildPluginTapOptionsCallbackType<T> = T extends ReturnType<IWpBuildPluginTapOptions["callback"]> ? X : never;
// declare type WpBuildPluginTapOptionsCallbackType2 = ReturnType<IWpBuildPluginTapOptions["callback"]>;
// declare type WpBuildPluginTapOptionsCallbackType3<T> = T extends WpBuildPluginTapOptionsCallbackType2<infer X> ? X : never;
// interface IWpBuildPluginTapOptions2
// {
//     async?: boolean;
//     hook: WebpackCompilerHookName;
//     hookCompilation?: WebpackCompilationHookName;
//     callback: (arg: WebpackCompiler | WebpackCompilationAssets | WebpackCompilationParams) => void | Promise<void>;
//     stage?: WebpackCompilationHookStage;
//     statsProperty?: string;
// }
/**
 * Defined types for this module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */

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

declare interface IWpBuildEnvironment extends IWpBuildEnvironmentInternal
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
    isMainProd: boolean,
    isMainTests: boolean;
    isTests: boolean;
    isWeb: boolean;
    global: WpBuildGlobalEnvironment;    // Accessible by all parallel builds
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
    verbose: boolean;
}
declare type WpBuildGlobalEnvironment = IWpBuildGlobalEnvironment & Record<string, any>;

declare type WpBuilLogColorType = typeof WpBuildRc.colors;
declare type WpBuildModuleLogColorType = typeof WpBuildRc.modules;
declare type WpBuildLogColorMapBuildType = typeof WpBuildRc.colors.builds;

declare type WpBuildLogColorMapBuilds = ConvertType<WpBuildLogColorMapBuildType, string, WpBuildLogTrueColor>;

// declare type WpBuildLogColorMap = ConvertType<Exclude<WpBuilLogColorType, "builds">, string, WpBuildLogTrueColor>;
declare type WpBuildLogColorMap = ConvertType<WpBuilLogColorType, string, WpBuildLogTrueColor>;

// declare type WpBuildLogColorMap2 = WpBuildLogColorMap & WpBuildLogColorMapBuilds;
declare type WpBuildModuleLogColorMap = ConvertType<WpBuildModuleLogColorType, string, WpBuildLogTrueColor>;

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
    valueMaxLineLength: number;
}
declare type WpBuildLogOptions = Required<IWpBuildLogOptions>;
declare type WpBuildModuleConfig = Record<WpBuildBuildEnvironment, Record<string, any> | string>;

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

declare type WpBuildExportsFlags = Record<WpBuildExportName, boolean>;
declare type WpBuildPluginsFlags = Record<Exclude<WpBuildPluginName, "dispose">, boolean>;

declare interface IWpBuildAppRc
{
    bannerName: string;                   // Displayed in startup banner detail line
    bannerNameDetailed: string;           // Displayed in startup banner detail line
    builds: WpBuildModuleConfig;
    colors: WpBuildLogColorMap;
    displayName: string;                  // displayName (read from package.json)
    exports: WpBuildExportsFlags;
    publicInfoProject: boolean | string;  // Project w/ private repo that maintains a public `info` project
    log: WpBuildLogOptions;
    name: string;                         // project name (read from package.json)
    pkgJson: WpBuildPackageJson;
    plugins: WpBuildPluginFlags;
    version: string;                      // app version (read from package.json)
    vscode: WpBuildVsCodeBuild
}
declare type WpBuildAppRc = IWpBuildAppRc & Record<string, any>;

declare interface IWpBuildVsCodeBuild
{
    webview: {
        baseDir: string;
        apps: Record<string, string>;     // in key/value for of `webviewsapp: "path/to/entry"`
    }
}
declare type WpBuildVsCodeBuild = IWpBuildVsCodeBuild & Record<string, any>;

declare interface IWpBuildPaths
{
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    dist: string;                         // output directory ~ wpConfig.output.path ~ compiler.options.output.path
    distTests: string;                    // output directory ~ wpConfig.output.path ~ compiler.options.output.path
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
declare type WpBuildBuildState = IWpBuildBuildState & Record<string, any>;

declare interface IWpBuildEnvironmentInternal
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
    statsPropertyColor?: Exclude<WpBuildLogTrueColor, "system">;
}
declare type WpBuildPluginTapOptions = Readonly<Omit<IWpBuildPluginTapOptions, "hookCompilation">> & Pick<IWpBuildPluginTapOptions, "hookCompilation">;
declare type WpBuildPluginTapOptionsHash  = Record<string, WpBuildPluginTapOptions>

export {
    WpBuildEnvironment,
    WpBuildApp,
    WpBuildAppRc,
    WpBuildBuildEnvironment,
    WpBuildCacheOptions,
    WpBuildExportName,
    WpBuildExportsFlags,
    WpBuildModule,
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildHashState,
    WpBuildLogColor,
    WpBuildLogColorMap,
    WpBuildLogIcon,
    WpBuildLogIconSet,
    WpBuildLogLevel,
    WpBuildModuleConfig,
    WpBuildModuleLogColorMap,
    WpBuildLogOptions,
    WpBuildLogTrueColor,
    WpBuildPackageJson,
    WpBuildPluginName,
    WpBuildPluginOptions,
    WpBuildPluginTapOptions,
    WpBuildPluginTapOptionsHash,
    WpBuildPluginVendorOptions,
    WpBuildPluginsFlags,
    WpBuildRuntimeVariables,
    WpBuildVsCodeBuild,
    WpBuildWebpackArgs,
    WpBuildWebpackConfig,
    __WPBUILD__
};

/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

declare type WebpackCompiler = import("webpack").Compiler;
declare type WebpackStatsAsset = import("webpack").StatsAsset;
declare type WebpackCompilation = import("webpack").Compilation;
declare type WebpackConfig = Required<import("webpack").Configuration>;
declare type WebpackAssetEmittedInfo = import("webpack").AssetEmittedInfo;
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;

declare type WebpackTarget = "webworker" | "node" | "web";
declare type WebpackMode = "none" | "development" | "production";
declare type WebpackBuildEnvironment= "dev" | "prod" | "test" | "testprod";
declare type WebpackLogLevel = "none" | "error" | "warn" | "info" | "log" | "verbose" | undefined;

declare type WpBuildModule = "browser" | "common" | "extension" | "tests" | "webview";

declare interface IWpBuildRuntimeVariables
{
    contentHash: Record<string, string>
}
type WpBuildRuntimeVariables = Required<IWpBuildRuntimeVariables>;

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
    isTests: boolean;
    isWeb: boolean;
    paths: WpBuildPaths;
    preRelease: boolean;
    state: WebpackBuildState;
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
}

type WpBuildEnvironment = Required<IWpBuildEnvironment>;


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

type WpBuildPackageJson = IWpBuildPackageJson & Record<string, any>;


declare interface IWpBuildGlobalEnvironment
{
    buildCount: number;
    cache: Record<string, any>;
    cacheDir: string;
    pkgJson: WpBuildPackageJson; 
    valuePad: number;
}

type WpBuildGlobalEnvironment = IWpBuildGlobalEnvironment & Record<string, any>;


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

type WpBuildApp = IWebpackApp & Record<string, any>;


declare interface IWebpackBuildFilePaths
{
    hash: string;
    sourceMapWasm: string;
}

type WebpackBuildFilePaths = Required<IWebpackBuildFilePaths> & Record<string, any>;


declare interface IWebpackVsCodeBuild
{
    webview: {
        baseDIr: string;
        apps: Record<string, string>;     // in key/value for of `webviewsapp: "path/to/entry"`
    }
}

type WebpackVsCodeBuild = IWebpackVsCodeBuild & Record<string, any>;


declare interface IWpBuildPaths
{
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    cache: string;
    dist: string;                         // main distribution path
    distBuild: string;                    // distribution path - release/debug mode specific
    files: WebpackBuildFilePaths;
    temp: string;                         // operating system temp directory
}

type WpBuildPaths = Required<IWpBuildPaths> & Record<string, any>;

declare interface IWpBuildHashState
{
    current: Record<string, string>;   // Content hash from last output chunks
    next: Record<string, string>;      // Content hash for new output chunk
    previous: Record<string, string>;  // Content hash from previous build's output chunks (prior to `current`)
}

type WpBuildHashState = Required<IWpBuildHashState>;

declare interface IWebpackBuildState
{
    hash: WpBuildHashState;
}

type WebpackBuildState = IWebpackBuildState & Record<string, any>;


declare interface IWebpackEnvironmentInternal
{
    WEBPACK_WATCH: boolean;
}

type WebpackEnvironmentInternal = Partial<IWebpackEnvironmentInternal>;


declare interface IWpBuildWebpackArgs
{
    config: string[];
    env: WpBuildEnvironment;
    mode: WebpackMode;
    watch: boolean;
}

type WpBuildWebpackArgs = Readonly<Partial<IWpBuildWebpackArgs>>;


interface IWpBuildPluginOptions
{
    env: WpBuildEnvironment,
    wpConfig: WebpackConfig
}

type WpBuildPluginOptions = Readonly<Required<IWpBuildPluginOptions>> & Record<string, any>;


export {
    WebpackAssetEmittedInfo,
    WpBuildModule,
    WebpackBuildState,
    WebpackCompiler,
    WebpackCompilation,
    WebpackConfig,
    WebpackMode,
    WebpackPluginInstance,
    WpBuildEnvironment,
    WebpackLogLevel,
    WebpackStatsAsset,
    WebpackTarget,
    WebpackBuildEnvironment,
    WebpackVsCodeBuild,
    WpBuildApp,
    WpBuildWebpackArgs,
    WpBuildPaths,
    WpBuildGlobalEnvironment,
    WpBuildHashState,
    WpBuildPackageJson,
    WpBuildPluginOptions,
    WpBuildRuntimeVariables,
    __WPBUILD__
};

/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check


declare type WebpackLogLevel = "none" | "error" | "warn" | "info" | "log" | "verbose" | undefined;
declare type WebpackBuild = "browser" | "common" | "extension" | "tests" | "webview";
declare type WebpackBuildMode = "debug" | "release";
declare type WebpackBuildEnvironment= "dev" | "prod" | "test" | "testprod";
declare type WebpackMode = "none" | "development" | "production";
declare type WebpackTarget = "webworker" | "node" | "web";
declare type WebpackConfig = Required<import("webpack").Configuration>;
declare type WebpackStatsAsset = import("webpack").StatsAsset;
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;
declare type WebpackAssetEmittedInfo = import("webpack").AssetEmittedInfo;
declare type WebpackCompiler = import("webpack").Compiler;
declare type WebpackOptimization = any;

declare interface WebpackEnvironment extends WebpackEnvironmentInternal
{
    analyze: boolean;                     // parform analysis after build
    app: IWebpackApp;                      // target js app info
    build: WebpackBuild;
    buildMode: WebpackBuildMode;
    clean: boolean;
    environment: WebpackBuildEnvironment;
    esbuild: boolean;                     // Use esbuild and esloader
    imageOpt: boolean;                    // Perform image optimization
    isTests: boolean;
    paths: WebpackBuildPaths;
    pkgJson: IWebpackPackageJson;         // package.json parsed object
    preRelease: boolean;
    state: WebpackBuildState;
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
}

declare interface IWebpackPackageJson extends Record<string, any>
{
    author: string | { name: string };
    description: string;
    displayName: string;
    main: string;
    module: boolean;
    name: string;
    publisher: string;
    version: string;
}

declare interface WebpackGlobalEnvironment extends Record<string, any>
{
    buildCount: number;
    pkgJson: Record<string, any>;
    valuePad: number;
}

declare interface IWebpackApp
{
    exports: Record<string, boolean>;
    mainChunk: string | string[];         // main module name(s)
    name: string;                         // app name (read from package.json)
    nameDetail: string;
    pkgJson: Record<string, any>;
    plugins: Record<string, boolean>;
    version: string;                      // app version (read from package.json)
    vscode: IWebpackVsCodeBuild
}

declare interface WebpackBuildFilePaths
{
    hash: string;
    sourceMapWasm: string;
}
declare interface IWebpackVsCodeBuild
{
    webview: Record<string, string>; // webviewsapp: "path/to/app"
}


declare interface WebpackBuildPaths
{
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    cache: string;
    dist: string;                         // main distribution path
    distBuild: string;                    // distribution path - release/debug mode specific
    files: WebpackBuildFilePaths;
    temp: string;                         // operating system temp directory
}

declare interface WebpackHashState
{
    current: Record<string, string>;  // Content hash from previous output chunk
    next: Record<string, string>;      // Content hash for new output chunk
}

declare interface WebpackBuildState
{
    hash: WebpackHashState;
}

declare interface WebpackEnvironmentInternal
{
    WEBPACK_WATCH: boolean;
}

declare interface WebpackArgs
{
    config: string[];
    env: WebpackEnvironment;
    mode: WebpackMode;
    watch: boolean;
}

export {
    IWebpackApp,
    WebpackArgs,
    WebpackAssetEmittedInfo,
    WebpackBuild,
    WebpackBuildMode,
    WebpackBuildPaths,
    WebpackBuildState,
    WebpackCompiler,
    WebpackConfig,
    WebpackGlobalEnvironment,
    WebpackHashState,
    IWebpackPackageJson,
    WebpackPluginInstance,
    WebpackOptimization,
    WebpackEnvironment,
    WebpackLogLevel,
    WebpackStatsAsset,
    WebpackTarget,
    WebpackBuildEnvironment,
    IWebpackVsCodeBuild
};

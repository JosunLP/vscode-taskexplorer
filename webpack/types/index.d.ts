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

declare interface IWebpackEnvironment extends WebpackEnvironmentInternal
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
    preRelease: boolean;
    state: WebpackBuildState;
    target: WebpackTarget;
    verbosity: WebpackLogLevel;
}

type WebpackEnvironment = IWebpackEnvironment & Record<string, any>;

declare interface IWebpackPackageJson
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

type WebpackPackageJson = IWebpackPackageJson & Record<string, any>;

declare interface IWebpackGlobalEnvironment
{
    buildCount: number;
    pkgJson: WebpackPackageJson; 
    valuePad: number;
}

type WebpackGlobalEnvironment = IWebpackGlobalEnvironment & Record<string, any>;

declare interface IWebpackApp
{
    exports: Record<string, boolean>;
    name: string;                         // project name (read from package.json)
    displayName: string;                  // displayName (read from package.json)
    description: string;                  // description (read from package.json)
    pkgJson: WebpackPackageJson;
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
    WebpackPackageJson,
    WebpackPluginInstance,
    WebpackOptimization,
    WebpackEnvironment,
    WebpackLogLevel,
    WebpackStatsAsset,
    WebpackTarget,
    WebpackBuildEnvironment,
    IWebpackVsCodeBuild
};

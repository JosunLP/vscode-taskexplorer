/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check


declare type WebpackLogLevel = "none" | "error" | "warn" | "info" | "log" | "verbose" | undefined;
declare type WebpackBuild = "browser" | "common" | "extension" | "tests" | "webview" | undefined;
declare type WebpackBuildEnvironment= "dev" | "prod" | "test" | "testprod";
declare type WebpackMode = "none" | "development" | "production";
declare type WebpakTarget = "webworker" | "node" | "web";
declare type WebpackBuildOrUndefined = WebpackBuild | undefined;
declare type WebpackConfig = import("webpack").Configuration;
declare type WebpackStatsAsset = import("webpack").StatsAsset;
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;
declare type WebpackAssetEmittedInfo = import("webpack").AssetEmittedInfo;
declare type WebpackCompiler = import("webpack").Compiler;
declare type WebpackOptimization = any;

declare interface WebpackEnvironment extends WebpackEnvironmentInternal
{
    analyze: boolean;                     // parform analysis after build
    app: WebpackApp;                      // target js app info
    build: WebpackBuild;
    clean: boolean;
    environment: WebpackBuildEnvironment;
    esbuild: boolean;                     // Use esbuild and esloader
    imageOpt: boolean;                    // Perform image optimization
    isTests: boolean;
    paths: WebpackBuildPaths;
    pkgJson: Record<string, any>;         // package.json parsed object
    preRelease: boolean;
    state: WebpackBuildState;
    stripLogging: boolean;
    target: WebpakTarget;
    verbosity: WebpackLogLevel;
}

declare interface WebpackApp
{
    name: string;                         // app name (read from package.json)
    version: string;                      // app version (read from package.json)
}

declare interface WebpackBuildFilePaths
{
    hash: string;
}

declare interface WebpackBuildPaths
{
    base: string;                         // context base dir path
    build: string;                        // base/root level dir path of project
    cache: string;
    dist: string;
    files: WebpackBuildFilePaths;
    temp: string;                         // operating system temp directory
}

declare interface WebpackEnvHashState
{
    current: Record<string, string | undefined>;  // Content hash from previous output chunk
    next: Record<string, string | undefined>;      // Content hash for new output chunk
}

declare interface WebpackHashState extends Readonly<Record<WebpackBuildEnvironment, WebpackEnvHashState>>
{
    browser: WebpackEnvHashState;
    dev: WebpackEnvHashState;
    prod: WebpackEnvHashState;
    test: WebpackEnvHashState;
    testprod: WebpackEnvHashState;
}

declare interface WebpackBuildState
{
    hash: Partial<WebpackHashState>;
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
    WebpackApp,
    WebpackArgs,
    WebpackAssetEmittedInfo,
    WebpackBuild,
    WebpackBuildOrUndefined,
    WebpackBuildPaths,
    WebpackBuildState,
    WebpackCompiler,
    WebpackConfig,
    WebpackEnvHashState,
    WebpackHashState,
    WebpackPluginInstance,
    WebpackOptimization,
    WebpackEnvironment,
    WebpackLogLevel,
    WebpackStatsAsset,
    WebpakTarget,
    WebpackBuildEnvironment
};

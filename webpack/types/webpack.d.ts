/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/** @typedef {import("../types/webpack").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types/webpack").WebpackEnvironment} WebpackEnvironment */
/** @typedef {import("../types/webpack").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("webpack").AssetEmittedInfo} WebpackAssetEmittedInfo */
/** @typedef {import("webpack").Compiler} WebpackCompiler */


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
    app: string;                          // app name (read from package.json)
    basePath: string;                     // context base dir path
    build: WebpackBuild;
    buildPath: string;                    // base/root level dir path of project
    clean: boolean;
    distPath: string;
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
    tempPath: string;                     // operating system temp directory
    verbosity: WebpackLogLevel;
    version: string;                      // app version (read from package.json)
}

declare interface WebpackBuildPaths
{
    hashFile: string;
    cacheDir: string;
}

declare interface WebpackBuildState
{
    hashCurrent: Record<string, string | undefined>;  // Content hash from previous output chunk
    hashNew: Record<string, string | undefined>;      // Content hash for new output chunk
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
    WebpackArgs,
    WebpackAssetEmittedInfo,
    WebpackBuild,
    WebpackBuildOrUndefined,
    WebpackBuildPaths,
    WebpackBuildState,
    WebpackCompiler,
    WebpackConfig,
    WebpackPluginInstance,
    WebpackOptimization,
    WebpackEnvironment,
    WebpackLogLevel,
    WebpackStatsAsset,
    WebpakTarget,
    WebpackBuildEnvironment
};

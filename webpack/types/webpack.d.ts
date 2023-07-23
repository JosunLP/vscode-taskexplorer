/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

declare type WebpackBuild = "browser" | "common" | "extension" | "tests" | "webview" | undefined;
declare type WebpackBuildEnvironment= "dev" | "prod" | "test" | "testprod";
declare type WebpackLogLevel = "none" | "error" | "warn" | "info" | "log" | "verbose" | undefined;
declare type WebpakTarget = "webworker" | "node" | "web";
declare type WebpackBuildOrUndefined = WebpackBuild|undefined;
declare type WebpackConfig = import("webpack").Configuration;
declare type WebpackMode = "none" | "development" | "production";
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;
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
    pkgJson: Record<string, any>;         // package.json parsed object
    preRelease: boolean;
    state: WebpackBuildState;
    stripLogging: boolean;
    target: WebpakTarget;
    tempPath: string;                     // operating system temp directory
    verbosity: WebpackLogLevel;
    version: string;                      // app version (read from package.json)
}

declare interface WebpackBuildState
{
    hashCurrent: string;                  // Content hash from previous output module build
    hashNew: string;                      // Content hash for new output module build
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
    WebpackBuild,
    WebpackBuildOrUndefined,
    WebpackBuildState,
    WebpackConfig,
    WebpackPluginInstance,
    WebpackOptimization,
    WebpackEnvironment,
    WebpackLogLevel,
    WebpakTarget,
    WebpackBuildEnvironment
};

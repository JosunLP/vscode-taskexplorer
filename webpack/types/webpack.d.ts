/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

declare type WebpackBuild = "browser"|"common"|"extension"|"tests"|"webview";
declare type WebpackBuildEnvironment= "dev"|"prod"|"test"|"testprod";
declare type WebpackLogLevel = "none" | "error" | "warn" | "info" | "log" | "verbose" | undefined;
declare type WebpakTarget = "webworker"|"node"|"web";
declare type WebpackBuildOrUndefined = WebpackBuild|undefined;
declare type WebpackConfig = import("webpack").Configuration;
declare type WebpackMode = "none" | "development" | "production";
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;
declare type WebpackOptimization = any;

declare interface WebpackEnvironment extends WebpackEnvironmentInternal
{
    analyze: boolean;
    basePath: string;
    build: WebpackBuild;
    buildPath: string;
    clean: boolean;
    environment: WebpackBuildEnvironment;
    esbuild: boolean; // Is ES build
    imageOpt: boolean; // Perform image optimization
    target: WebpakTarget;
    verbosity: WebpackLogLevel;
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
    WebpackConfig,
    WebpackPluginInstance,
    WebpackOptimization,
    WebpackEnvironment,
    WebpackLogLevel,
    WebpakTarget,
    WebpackBuildEnvironment
};

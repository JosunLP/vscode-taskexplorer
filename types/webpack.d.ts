
//@ts-check
declare type WebpackBuild = "browser"|"client"|"common"|"extension"|"server"|"tests"|"webview";
declare type WebpackBuildEnvironment= "dev"|"prod"|"test"|"testprod";
declare type WebpackLogLevel = "none" | "log" | "verbose" | "error" | "warn" | "info" | undefined;
declare type WebpakTarget = "webworker"|"node"|"web";
declare type WebpackBuildOrUndefined = WebpackBuild|undefined;
declare type WebpackConfig = import("webpack").Configuration;
declare type WebpackPluginInstance = import("webpack").WebpackPluginInstance;
declare type WebpackOptimization = any;

declare interface WebpackEnvironment
{
    analyze: boolean;
    basePath: string;
    build: WebpackBuild;
    clean: boolean;
    environment: WebpackBuildEnvironment;
    esbuild: boolean; // Is ES build
    imageOpt: boolean; // Perform image optimization
    target: WebpakTarget;
    verbosity: WebpackLogLevel
}

export {
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

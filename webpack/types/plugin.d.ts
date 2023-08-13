
/**
 * @file types/plugin.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 * 
 * Handy file links:
 * 
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 * 
 * @description
 *
 * @description
 *
 * Provides types to interface the plugin sysem in this project.
 *
 * All types exported from this definition file are prepended with `WpBuildPlugin`.
 */

import { IWpBuildApp } from "./app";
import { WpBuildLogTrueColor } from "./logger";
import {
    WebpackCompilationHookName, WebpackCompilerHookName, WebpackCompiler, WebpackCompilationAssets,
    WebpackCompilationParams, WebpackPluginInstance, WebpackCompilationHookStage
} from "./webpack";


declare interface IWpBuildPluginVendorOptions extends Record<string, any>
{
    ctor: new(...args: any[]) => WebpackPluginInstance,
    options: Readonly<Record<string, any>>
}
declare type WpBuildPluginVendorOptions = IWpBuildPluginVendorOptions;

declare interface IWpBuildPluginOptions extends Record<string, any>
{
    app: IWpBuildApp,
    plugins?: WpBuildPluginVendorOptions | WpBuildPluginVendorOptions[],
    registerVendorPluginsFirst?: boolean;
}
declare type WpBuildPluginOptions = IWpBuildPluginOptions;

declare type WpBuildPluginCacheOptions = { file: string; }

declare interface IWpBuildPluginTapOptions
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

declare interface IWpBuildPlugin
{
}


export {
    IWpBuildPlugin,
    WpBuildPluginCacheOptions,
    WpBuildPluginOptions,
    WpBuildPluginTapOptions,
    WpBuildPluginTapOptionsHash,
    WpBuildPluginVendorOptions
};

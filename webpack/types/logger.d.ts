
/**
 * @file types/log.d.ts
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
 * Defined types for internal WpBuild module are prefixed with `WpBuild` (type) and `IWpBuild` (interface) for convention.
 */

declare type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;
declare type WpBuildLogTrueColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow";
declare type WpBuildLogColor = WpBuildLogTrueColor | "bold" | "inverse" | "italic" | "underline";

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

declare type WpBuildLogColorMapping = [ number, number ];

// declare interface IWpBuildLogger implements IDisposable
// {
//     colors: Record<WpBuildLogColor, WpBuildLogColorMapping>;
//     icons: WpBuildLogIconSet;
//     private basePad: string;
//     private app: WpBuildApp;
//     private infoIcon: string;
//     withColor(msg: string | undefined, color: WpBuildLogColorMapping, sticky?: boolean): string;
//     error: (msg: any, pad?: string) => void;
//     start: (msg: string, level?: WpBuildLogLevel) => void;
//     tag: (msg: string, bracketColor?: WpBuildLogColorMapping | null, msgColor?: WpBuildLogColorMapping | null) => void;
//     value: (msg: string, value: any, level?: WpBuildLogLevel, pad?: string, icon?: string | undefined | null | 0 | false, color?: WpBuildLogColorMapping | null) => void;
//     valuestar: (msg: string, value: any, level?: WpBuildLogLevel, pad?: string, iconColor?: WpBuildLogColorMapping | null, msgColor?: WpBuildLogColorMapping | null) => void;
//     warning: (msg: any, pad?: string) => void;
//     write: (msg: string, level?: WpBuildLogLevel, pad?: string, icon: string | undefined | null | 0 | false, color: WpBuildLogColorMapping | null) => void;
//     writeMsgTag: (msg: string, tagMsg: string, bracketColor?: WpBuildLogColorMapping | null, msgColor?: WpBuildLogColorMapping | null) => void;
// }

export {
    WpBuildLogColor,
    WpBuildLogColorMapping,
    WpBuildLogIcon,
    WpBuildLogIconSet,
    WpBuildLogLevel,
    WpBuildLogTrueColor
};

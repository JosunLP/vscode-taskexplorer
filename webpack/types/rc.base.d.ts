
/**
 * @file types/index.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 *
 * This file was auto generated using the 'json-to-typescript' utility
 * 
 * Handy file links:
 * 
 * COMPILER  : file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\vscode-taskexplorer\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\vscode-taskexplorer\webpack\utils\app.js
 */

export type WpBuildRcBuilds = [WpBuildRcBuild, ...WpBuildRcBuild[]];

export type WpBuildWebpackMode = "development" | "production" | "none" | "test" | "testproduction";

export type WebpackTarget =
    | "node"
    | "web"
    | "webworker"
    | "async-node"
    | "node-webkit"
    | "electron-main"
    | "electron-renderer"
    | "electron-preload"
    | "nwjs"
    | "esX"
    | "browserlist";


export type WpBuildLogLevel = WpBuildLogLevel1 & WpBuildLogLevel2;

export type WpBuildLogLevel1 = number;

export type WpBuildLogLevel2 = 0 | 1 | 2 | 3 | 4 | 5;

export type WpBuildLogTrueColor =
    | "black"
    | "blue"
    | "cyan"
    | "green"
    | "grey"
    | "magenta"
    | "red"
    | "system"
    | "white"
    | "yellow";

export type WpBuildLogColor =
    | "black"
    | "blue"
    | "cyan"
    | "green"
    | "grey"
    | "magenta"
    | "red"
    | "system"
    | "white"
    | "yellow"
    | "bold"
    | "inverse"
    | "italic"
    | "underline";

export interface WpBuildRcSchema {
    $schema?: string;
    name: string;
    displayName?: string;
    detailedDisplayName?: string;
    publicInfoProject?: boolean;
    builds?: WpBuildRcBuilds;
    development?: WpBuildRcEnvironment;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
    production?: WpBuildRcEnvironment;
    test?: WpBuildRcEnvironment;
    testproduction?: WpBuildRcEnvironment;
    vscode?: WpBuildRcVsCode;
}

export interface WpBuildRcBuild {
    name: string;
    entry?: WebpackEntry;
    mode?: WpBuildWebpackMode ;
    target?: WebpackTarget ;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
}

export interface WebpackEntry {
    import: string;
    dependsOn?: string;
    [k: string]: string | undefined;
}

export interface WpBuildRcLog {
    level?: WpBuildLogLevel;
    valueMaxLineLength?: number;
    colors?: WpBuildRcLogColors;
    pad?: WpBuildRcLogPad;
}

export interface WpBuildRcLogColors {
    default?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    buildBracket?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    buildText?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    infoIcon?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    valueStar?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    valueStarText?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    tagBracket?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    tagText?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
    uploadSymbol?: ("black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow") &
        string;
}

export interface WpBuildRcLogPad {
    base?: number;
    envTag?: number;
    value?: number;
    uploadFileName?: number;
}

export interface WpBuildRcPaths {
    dist?: string;
    src?: string;
}

export interface WpBuildRcExports {
    cache?: boolean;
    context?: true;
    devtool?: boolean;
    entry?: true;
    experiments?: boolean;
    externals?: boolean;
    ignorewarnings?: boolean;
    minification?: boolean;
    mode?: true;
    name?: true;
    optimization?: boolean;
    output?: true;
    plugins?: true;
    resolve?: true;
    rules?: true;
    stats?: boolean;
    target?: true;
    watch?: boolean;
}

export interface WpBuildRcPlugins {
    analyze?: boolean;
    banner?: boolean;
    clean?: boolean;
    copy?: boolean;
    environment?: true;
    html?: true;
    ignore?: boolean;
    istanbul?: boolean;
    licensefiles?: boolean;
    loghooks?: true;
    optimization?: true;
    progress?: boolean;
    runtimevars?: boolean;
    scm?: boolean;
    sourcemaps?: boolean;
    testsuite?: boolean;
    tscheck?: boolean;
    upload?: boolean;
    vendormod?: boolean;
    wait?: boolean;
}

export interface WpBuildRcEnvironment {
    builds: WpBuildRcBuilds;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
}

export interface WpBuildRcVsCode {
    testsEntry?: string;
}

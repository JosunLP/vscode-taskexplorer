
/**
 * @file types/rc.d.ts
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
 * 
 * @description
 *
 * Provides types macthing the .wpbuildrc.json configuration file schema
 *
 * All types exported from this definition file are prepended with `WpBuildRc`.
 */


export declare type WpBuildRcBuilds = [WpBuildRcBuild, ...WpBuildRcBuild[]];

export declare type WebpackEntry = string | { import?: string; dependsOn?: string; [k: string]: string | undefined; };

export declare type WpBuildWebpackMode = "development" | "production" | "none" | "test" | "testproduction";

export declare type WebpackTarget = | "node" | "web" | "webworker" | "async-node" | "node-webkit" | "electron-main" | "electron-renderer" | "electron-preload" | "nwjs" | "esX" | "browserlist";

export declare type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;

export declare type WpBuildLogTrueColor = | "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow";

export declare type WpBuildLogColor = | "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow" | "bold" | "inverse" | "italic" | "underline";

export declare interface IWpBuildRcSchema 
{
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
};
export declare type WpBuildRcSchema = IWpBuildRcSchema;

export declare type WpBuildRcBuild = 
{
    name: string;
    entry?: WebpackEntry;
    mode?: WpBuildWebpackMode ;
    target?: WebpackTarget ;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
}

export declare type WpBuildRcLog = 
{
    level?: WpBuildLogLevel;
    valueMaxLineLength?: number;
    colors?: WpBuildRcLogColors;
    pad?: WpBuildRcLogPad;
}

export declare type WpBuildRcLogColors = 
{
    default?: WpBuildLogTrueColor ;
    buildBracket?: WpBuildLogTrueColor ;
    buildText?: WpBuildLogTrueColor ;
    infoIcon?: WpBuildLogTrueColor ;
    valueStar?: WpBuildLogTrueColor ;
    valueStarText?: WpBuildLogTrueColor ;
    tagBracket?: WpBuildLogTrueColor ;
    tagText?: WpBuildLogTrueColor ;
    uploadSymbol?: WpBuildLogTrueColor ;
}

export declare type WpBuildRcLogPad = 
{
    base?: number;
    envTag?: number;
    value?: number;
    uploadFileName?: number;
}

export declare type WpBuildRcPaths = 
{
    dist?: string;
    src?: string;
}

export declare type WpBuildRcExports = 
{
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

export declare type WpBuildRcPlugins = 
{
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

export declare type WpBuildRcEnvironment = 
{
    builds: WpBuildRcBuilds;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
}

export declare type WpBuildRcVsCode = 
{
    testsEntry?: string;
}

export declare type WpBuildRcPackageJson = 
{
    author?: string | { name: string; email?: string };
    description?: string;
    displayName?: string;
    main?: string;
    module?: string;
    name?: string;
    publisher?: string;
    version?: string;
}

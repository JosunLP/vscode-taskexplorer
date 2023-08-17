
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


export declare type WpBuildRcSourceCodeType = "javascript" | "typescript";

export declare type WpBuildRcBuildType = "module" | "tests" | "types" | "webapp" | "webmodule";

export declare type WpBuildWebpackEntryValue = FilePathRelativeLeadingDot | WpBuildWebpackEntryObject;

export declare type FilePathRelativeLeadingDot = string;

export declare type FileName = string;

export declare type FilePathRelative = string;

export declare type DirectoryPathRelative = string;

export declare type WpBuildWebpackMode = "development" | "production" | "none" | "test" | "testproduction";

export declare type WebpackTarget = "node" | "web" | "webworker" | "async-node" | "node-webkit" | "electron-main" | "electron-renderer" | "electron-preload" | "nwjs" | "esX" | "browserlist";

export declare type WpBuildWebpackAliasValue = string | string[] | false;

export declare type WpBuildLogTrueColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "white" | "yellow";

export declare type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;

export declare type WpBuildRcBuilds = WpBuildRcBuild[];

export declare type DirectoryPath = string;

export declare type DirectoryPathGlob = string;

export declare type WpBuildLogColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow" | "bold" | "inverse" | "italic" | "underline";

export declare interface IWpBuildRcSchema 
{
    name: string;
    displayName?: string;
    detailedDisplayName?: string;
    publicInfoProject?: boolean;
    singleBuildName?: string;
    source?: WpBuildRcSourceCodeType;
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
    build: string;
    source?: WpBuildRcSourceCodeType;
    type: WpBuildRcBuildType;
    entry: WpBuildWebpackEntry;
    mode: WpBuildWebpackMode;
    target: WebpackTarget;
    alias?: WpBuildWebpackAliasConfig;
    log?: WpBuildRcLog;
    paths: WpBuildRcPaths;
    exports: WpBuildRcExports;
    plugins: WpBuildRcPlugins;
};
export declare type WpBuildRcBuildKey = keyof WpBuildRcBuild;
export declare type TypeWpBuildRcBuild = Required<WpBuildRcBuild>;

export declare type WpBuildWebpackEntry = 
{
    [k: string]: WpBuildWebpackEntryValue;
};

export declare type WpBuildWebpackEntryObject = 
{
    asyncChunks?: boolean;
    baseUri?: string;
    chunkLoading?: boolean | (("jsonp" | "import" | "importScripts" | "require" | "async-node") & string);
    dependOn?: string;
    filename?: FileName;
    import: FilePathRelative;
    layer?: ("debug" | "release") & string;
    publicPath?: DirectoryPathRelative;
};

export declare type WpBuildWebpackAliasConfig = 
{
    [k: string]: WpBuildWebpackAliasValue;
};
export declare type WpBuildRcLog = 
{
    color?: WpBuildLogTrueColor;
    colors: WpBuildRcLogColors;
    envTag1?: string;
    envTag2?: string;
    envTagDisable?: boolean;
    level: WpBuildLogLevel;
    pad: WpBuildRcLogPad;
    timestamp?: ("mm:ss" | "mm:ss:sss" | "hh:mm:ss" | "hh:mm:ss:sss") & string;
    valueMaxLineLength?: number;
};
export declare type WpBuildRcLogKey = keyof WpBuildRcLog;
export declare type TypeWpBuildRcLog = Required<WpBuildRcLog>;

export declare type WpBuildRcLogColors = 
{
    default: WpBuildLogTrueColor;
    buildBracket?: WpBuildLogTrueColor;
    buildText?: WpBuildLogTrueColor;
    infoIcon?: WpBuildLogTrueColor;
    valueStar?: WpBuildLogTrueColor;
    valueStarText?: WpBuildLogTrueColor;
    tagBracket?: WpBuildLogTrueColor;
    tagText?: WpBuildLogTrueColor;
    uploadSymbol?: WpBuildLogTrueColor;
};
export declare type WpBuildRcLogColorsKey = keyof WpBuildRcLogColors;
export declare type TypeWpBuildRcLogColors = Required<WpBuildRcLogColors>;

export declare type WpBuildRcLogPad = 
{
    base?: number;
    envTag?: number;
    value: number;
    uploadFileName?: number;
};
export declare type WpBuildRcLogPadKey = keyof WpBuildRcLogPad;
export declare type TypeWpBuildRcLogPad = Required<WpBuildRcLogPad>;

export declare type WpBuildRcPaths = 
{
    base: string;
    ctx?: string;
    dist?: string;
    distModule?: string;
    distTests?: string;
    distTypes?: string;
    distWebApp?: string;
    distWebModule?: string;
    src?: string;
    srcEnv?: string;
    srcModule?: string;
    srcTests?: string;
    srcTypes?: string;
    srcWebApp?: string;
    srcWebModule?: string;
    temp: string;
    tsconfig?: string;
};
export declare type WpBuildRcPathsKey = keyof WpBuildRcPaths;
export declare type TypeWpBuildRcPaths = Required<WpBuildRcPaths>;

export declare type WpBuildRcExports = 
{
    cache?: boolean;
    devtool?: boolean;
    entry?: true;
    experiments?: boolean;
    externals?: boolean;
    ignorewarnings?: boolean;
    minification?: boolean;
    optimization?: boolean;
    output?: true;
    plugins?: true;
    resolve?: true;
    rules?: true;
    stats?: boolean;
    watch?: boolean;
};
export declare type WpBuildRcExportsKey = keyof WpBuildRcExports;
export declare type TypeWpBuildRcExports = Required<WpBuildRcExports>;

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
};
export declare type WpBuildRcPluginsKey = keyof WpBuildRcPlugins;
export declare type TypeWpBuildRcPlugins = Required<WpBuildRcPlugins>;

export declare type WpBuildRcEnvironment = 
{
    alias?: WpBuildWebpackAliasConfig;
    builds?: WpBuildRcBuilds;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
};

export declare type WpBuildRcVsCode = 
{
    extension?: boolean;
    languageServer?: boolean;
};

export declare type WebpackConfigOverride = 
{
    [k: string]: unknown;
};

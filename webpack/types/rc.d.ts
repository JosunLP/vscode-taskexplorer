
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


export declare type WpBuildRcBuildType = "module" | "tests" | "types" | "webapp" | "webmodule";

export declare type WebpackEntry = WebpackEntryPath | WebpackEntryObject;

export declare type FilePathRelative = string;

export declare type FileName = string;

export declare type DirectoryPathRelative = string;

export declare type WpBuildWebpackMode = "development" | "production" | "none" | "test" | "testproduction";

export declare type WebpackTarget = "node" | "web" | "webworker" | "async-node" | "node-webkit" | "electron-main" | "electron-renderer" | "electron-preload" | "nwjs" | "esX" | "browserlist";

export declare type WpBuildLogTrueColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow";

export declare type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;

export declare type WpBuildRcBuilds = WpBuildRcBuild[];

export declare type WpBuildLogColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow" | "bold" | "inverse" | "italic" | "underline";

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

export declare type TypeWpBuildRcBuild = 
{
    name: string;
    type?: WpBuildRcBuildType;
    entry?: WebpackEntry;
    mode?: WpBuildWebpackMode;
    target?: WebpackTarget;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
};
export declare enum WpBuildRcBuildEnum 
{
    Name = "name",
    Type = "type",
    Entry = "entry",
    Mode = "mode",
    Target = "target",
    Log = "log",
    Paths = "paths",
    Exports = "exports",
    Plugins = "plugins",
};
export declare type WpBuildRcBuildKey = keyof WpBuildRcBuild;
export declare type WpBuildRcBuild = Required<TypeWpBuildRcBuild>;

export declare type WebpackEntryPath = 
{
    [k: string]: FilePathRelative;
};

export declare type WebpackEntryObject = 
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
export declare type TypeWpBuildRcLog = 
{
    color?: WpBuildLogTrueColor;
    colors?: WpBuildRcLogColors;
    level?: WpBuildLogLevel;
    pad?: WpBuildRcLogPad;
    valueMaxLineLength?: number;
};
export declare enum WpBuildRcLogEnum 
{
    Color = "color",
    Colors = "colors",
    Level = "level",
    Pad = "pad",
    ValueMaxLineLength = "valueMaxLineLength",
};
export declare type WpBuildRcLogKey = keyof WpBuildRcLog;
export declare type WpBuildRcLog = Required<TypeWpBuildRcLog>;

export declare type TypeWpBuildRcLogColors = 
{
    default?: WpBuildLogTrueColor;
    buildBracket?: WpBuildLogTrueColor;
    buildText?: WpBuildLogTrueColor;
    infoIcon?: WpBuildLogTrueColor;
    valueStar?: WpBuildLogTrueColor;
    valueStarText?: WpBuildLogTrueColor;
    tagBracket?: WpBuildLogTrueColor;
    tagText?: WpBuildLogTrueColor;
    uploadSymbol?: WpBuildLogTrueColor;
};
export declare enum WpBuildRcLogColorsEnum 
{
    Default = "default",
    BuildBracket = "buildBracket",
    BuildText = "buildText",
    InfoIcon = "infoIcon",
    ValueStar = "valueStar",
    ValueStarText = "valueStarText",
    TagBracket = "tagBracket",
    TagText = "tagText",
    UploadSymbol = "uploadSymbol",
};
export declare type WpBuildRcLogColorsKey = keyof WpBuildRcLogColors;
export declare type WpBuildRcLogColors = Required<TypeWpBuildRcLogColors>;

export declare type TypeWpBuildRcLogPad = 
{
    base?: number;
    envTag?: number;
    value?: number;
    uploadFileName?: number;
};
export declare enum WpBuildRcLogPadEnum 
{
    Base = "base",
    EnvTag = "envTag",
    Value = "value",
    UploadFileName = "uploadFileName",
};
export declare type WpBuildRcLogPadKey = keyof WpBuildRcLogPad;
export declare type WpBuildRcLogPad = Required<TypeWpBuildRcLogPad>;

export declare type TypeWpBuildRcPaths = 
{
    ctx?: string;
    dist?: string;
    src?: string;
    srcTests?: string;
    srcTypes?: string;
    srcWebApp?: string;
    tsconfig?: string;
};
export declare enum WpBuildRcPathsEnum 
{
    Ctx = "ctx",
    Dist = "dist",
    Src = "src",
    SrcTests = "srcTests",
    SrcTypes = "srcTypes",
    SrcWebApp = "srcWebApp",
    Tsconfig = "tsconfig",
};
export declare type WpBuildRcPathsKey = keyof WpBuildRcPaths;
export declare type WpBuildRcPaths = Required<TypeWpBuildRcPaths>;

export declare type TypeWpBuildRcExports = 
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
export declare enum WpBuildRcExportsEnum 
{
    Cache = "cache",
    Devtool = "devtool",
    Entry = "entry",
    Experiments = "experiments",
    Externals = "externals",
    Ignorewarnings = "ignorewarnings",
    Minification = "minification",
    Optimization = "optimization",
    Output = "output",
    Plugins = "plugins",
    Resolve = "resolve",
    Rules = "rules",
    Stats = "stats",
    Watch = "watch",
};
export declare type WpBuildRcExportsKey = keyof WpBuildRcExports;
export declare type WpBuildRcExports = Required<TypeWpBuildRcExports>;

export declare type TypeWpBuildRcPlugins = 
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
export declare enum WpBuildRcPluginsEnum 
{
    Analyze = "analyze",
    Banner = "banner",
    Clean = "clean",
    Copy = "copy",
    Environment = "environment",
    Html = "html",
    Ignore = "ignore",
    Istanbul = "istanbul",
    Licensefiles = "licensefiles",
    Loghooks = "loghooks",
    Optimization = "optimization",
    Progress = "progress",
    Runtimevars = "runtimevars",
    Scm = "scm",
    Sourcemaps = "sourcemaps",
    Testsuite = "testsuite",
    Tscheck = "tscheck",
    Upload = "upload",
    Vendormod = "vendormod",
    Wait = "wait",
};
export declare type WpBuildRcPluginsKey = keyof WpBuildRcPlugins;
export declare type WpBuildRcPlugins = Required<TypeWpBuildRcPlugins>;

export declare type WpBuildRcEnvironment = 
{
    builds: WpBuildRcBuilds;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExports;
    plugins?: WpBuildRcPlugins;
};

export declare type WpBuildRcVsCode = 
{
    testsEntry?: FilePathRelative;
};

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
};

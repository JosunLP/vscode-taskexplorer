
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
 * WEBPACK TYPES: file:///c:\Projects\vscode-taskexplorer\node_modules\webpack\types.d.ts
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

export declare type DirectoryPathRelative = string;

export declare type WpBuildWebpackMode = "development" | "production" | "none" | "test";

export declare type WebpackTarget = "node" | "web" | "webworker" | "async-node" | "node-webkit" | "electron-main" | "electron-renderer" | "electron-preload" | "nwjs" | "esX" | "browserlist";

export declare type WpBuildWebpackAliasValue = string | string[] | false;

export declare type WpBuildLogTrueColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "white" | "yellow";

export declare type WpBuildLogLevel = 0 | 1 | 2 | 3 | 4 | 5;

export declare type WpBuildRcPlugins = WpBuildRcPluginsUser | WpBuildRcPluginsInternal;

export declare type WpBuildRcPluginConfigAnalyze = | boolean | 
{
          analyzer?: boolean;
          circular?: boolean;
          visualizer?: boolean;
      };

export declare type WpBuildRcPluginConfigBanner = boolean | string;

export declare type WpBuildRcPluginConfigUpload = | boolean | 
{
          url?: string;
          plink?: 
{
              user: string;
              key: string;
          };
          scp?: 
{
              user: string;
              key: string;
          };
      };

export declare type WpBuildRcPluginConfigVendorMod = | boolean | 
{
          clean_plugin: boolean;
          ts_loader: boolean;
      };

export declare type WpBuildRcBuilds = WpBuildRcBuild[];

export declare type DirectoryPath = string;

export declare type DirectoryPathGlob = string;

export declare type FilePathRelative = string;

export declare type WpBuildRcExports = WpBuildRcExportsUser & WpBuildRcExportsInternal;

export declare type WpBuildLogColor = "black" | "blue" | "cyan" | "green" | "grey" | "magenta" | "red" | "system" | "white" | "yellow" | "bold" | "inverse" | "italic" | "underline";

export declare type WebpackLibraryType = "var" | "module" | "assign" | "assign-properties" | "this" | "window" | "self" | "global" | "commonjs" | "commonjs2" | "commonjs-module" | "commonjs-static'" | "amd" | "amd-require" | "umd'" | "umd2" | "jsonp" | "system";

export declare interface IWpBuildRcSchema 
{
    name: string;
    displayName?: string;
    detailedDisplayName?: string;
    publicInfoProject?: boolean;
    singleBuildName?: string;
    source?: WpBuildRcSourceCodeType;
    builds: WpBuildRcBuilds;
    development?: WpBuildRcBuildModeConfig;
    log?: WpBuildRcLog;
    alias?: WpBuildWebpackAliasConfig;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExportsUser;
    plugins?: WpBuildRcPluginsUser;
    production?: WpBuildRcBuildModeConfig;
    test?: WpBuildRcBuildModeConfig;
    vscode?: WpBuildRcVsCodeConfig;
}

export declare type WpBuildRcSchema = IWpBuildRcSchema;

export declare type WpBuildRcBuild = 
{
    name: string;
    active?: boolean;
    auto?: boolean;
    debug?: boolean;
    source?: WpBuildRcSourceCodeType;
    type: WpBuildRcBuildType;
    entry: WpBuildWebpackEntry;
    mode: WpBuildWebpackMode;
    target: WebpackTarget;
    alias: WpBuildWebpackAliasConfig;
    log: WpBuildRcLog;
    paths: WpBuildRcPaths;
    exports: WpBuildRcExportsUser;
    plugins: WpBuildRcPlugins;
    vscode?: WpBuildRcVsCodeConfig;
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
    dependOn?: string | string[];
    filename?: FileName;
    import: FilePathRelativeLeadingDot;
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
    ctx: string;
    dist: string;
    src: string;
    temp: string;
    tsconfig?: string;
};
export declare type WpBuildRcPathsKey = keyof WpBuildRcPaths;
export declare type TypeWpBuildRcPaths = Required<WpBuildRcPaths>;

export declare type WpBuildRcExportsUser = 
{
    cache?: boolean;
    devtool?: boolean;
    experiments?: boolean;
    externals?: boolean;
    ignorewarnings?: boolean;
    minification?: boolean;
    optimization?: boolean;
    stats?: boolean;
    watch?: boolean;
};

export declare type WpBuildRcPluginsUser = 
{
    analyze?: WpBuildRcPluginConfigAnalyze;
    banner?: WpBuildRcPluginConfigBanner;
    ignore?: boolean;
    istanbul?: boolean;
    licensefiles?: boolean;
    loghooks?: boolean;
    optimization?: boolean;
    progress?: boolean;
    scm?: boolean;
    sourcemaps?: boolean;
    upload?: WpBuildRcPluginConfigUpload;
    vendormod?: WpBuildRcPluginConfigVendorMod;
};

export declare type WpBuildRcPluginsInternal = 
{
    readonly clean?: boolean;
    readonly copy?: boolean;
    readonly dispose?: boolean;
    readonly environment?: boolean;
    readonly html?: boolean;
    readonly runtimevars?: boolean;
    readonly testsuite?: boolean;
    readonly tsbundle?: boolean;
    readonly tscheck?: boolean;
    readonly types?: boolean;
    readonly wait?: boolean;
};

export declare type WpBuildRcVsCodeConfig = 
{
    type: false | "extension" | "languageclient" | "languageserver" | "none" | "tests";
};

export declare type WpBuildRcBuildModeConfig = 
{
    alias?: WpBuildWebpackAliasConfig;
    builds?: WpBuildRcBuilds;
    log?: WpBuildRcLog;
    paths?: WpBuildRcPaths;
    exports?: WpBuildRcExportsUser;
    plugins?: WpBuildRcPluginsUser;
    vscode?: WpBuildRcVsCodeConfig;
};

export declare type WpBuildRcExportsInternal = 
{
    entry?: boolean;
    output?: boolean;
    plugins?: boolean;
    resolve?: boolean;
    rules?: boolean;
};

export declare type WpBuildRcPackageJson = 
{
    author?: string | { name: string; email?: string };
    description?: string;
    displayName?: string;
    main?: string;
    module?: string;
    name: string;
    publisher?: string;
    version: string;
};

export declare type WebpackConfigOverride = 
{
    [k: string]: unknown;
};

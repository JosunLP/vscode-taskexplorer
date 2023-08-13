
/**
 * @namespace typedefs
 * @exports
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("./webpack").WebpackLogger} WebpackLogger */
/** @typedef {import("./webpack").WebpackSource} WebpackSource */
/** @typedef {import("./webpack").WebpackCompiler} WebpackCompiler */
/** @typedef {import("./webpack").WebpackSnapshot} WebpackSnapshot */
/** @typedef {import("./webpack").WebpackRawSource} WebpackRawSource */
/** @typedef {import("./webpack").WebpackCacheFacade} WebpackCacheFacade */
/** @typedef {import("./webpack").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildWebpackConfig} WpBuildWebpackConfig */
/** @typedef {import("../utils").WpBuildConsoleLogger} WpBuildConsoleLogger */
/** @typedef {import("./webpack").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("./plugin").WpBuildPluginTapOptions} WpBuildPluginTapOptions */
/** @typedef {import("./webpack").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("./webpack").WebpackCompilationParams} WebpackCompilationParams */
/** @typedef {import("./webpack").WebpackCompilerAsyncHook} WebpackCompilerAsyncHook */
/** @typedef {import("./plugin").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */
/** @typedef {import("./webpack").WebpackStatsPrinterContext} WebpackStatsPrinterContext */
/** @typedef {import("./webpack").WebpackCompilationHookStage} WebpackCompilationHookStage */
/** @typedef {import("./plugin").WpBuildPluginTapOptionsHash} WpBuildPluginTapOptionsHash */
/** @typedef {import("./webpack").WebpackCompilerSyncHookName} WebpackCompilerSyncHookName */
/** @typedef {import("./webpack").WebpackSyncHook<WebpackCompiler>} WebpackSyncCompilerHook */
/** @typedef {import("./webpack").WebpackCompilerAsyncHookName} WebpackCompilerAsyncHookName */
/** @typedef {import("./webpack").WebpackAsyncHook<WebpackCompiler>} WebpackAsyncCompilerHook */
/** @typedef {import("../types").WebpackSyncHook<WebpackCompilation>} WebpackSyncCompilationHook */
/** @typedef {import("./webpack").WebpackAsyncHook<WebpackCompilation>} WebpackAsyncCompilationHook */
/** @typedef {{ file: string; snapshot?: WebpackSnapshot | null; source?: WebpackRawSource }} CacheResult */
/** @typedef {import("./plugin").RequireKeys<WpBuildPluginTapOptions, "stage" | "hookCompilation">} WpBuildPluginCompilationOptions */

/**
 * @typedef {Record<string, any>} WpBuildPluginOptions
 * @property {WpBuildApp} app
 * @property {boolean} [registerVendorPluginsFirst]
 * @property {WpBuildPluginVendorOptions | WpBuildPluginVendorOptions[]} [plugins]
 */

/**
 * This callback is displayed as part of the Requester class.
 * @callback WpBuildPluginHookCallback
 * @param {...any} args
 * @returns {any}
 */

exports.unused = {};

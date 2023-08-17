/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/utils.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const JSON5 = require("json5");
const { glob } = require("glob");
const { promisify } = require("util");
const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const { spawnSync } = require("child_process");
const { existsSync } = require("fs");
const { join, resolve, basename, dirname } = require("path");
const exec = promisify(require("child_process").exec);

const globOptions = {
    ignore: [ "**/node_modules/**", "**/.vscode*/**", "**/build/**", "**/dist/**", "**/res*/**", "**/doc*/**" ]
};


/**
 * @function
 * @template {{}} T
 * @template {{}} U extends T
 * @param {T | Partial<T>} object
 * @param {U | T | Partial<T> | undefined} config
 * @param {U | T | Partial<T> | undefined} [defaults]
 * @returns {T}
 */
const apply = (object, config, defaults) =>
{
    if (isObject(object))
    {
        if (isObject(defaults)) {
            apply(object, defaults);
        }
        if (isObject(config)) {
            Object.keys(config).forEach(i => { object[i] = config[i]; });
        }
    }
    return /** @type {T} */(object);
};


/**
 * @function
 * @template T
 * @param {T | Set<T> | Array<T>} v Variable to check to see if it's an array
 * @param {boolean} [shallow] If `true`, and  `arr` is an array, return a shallow copy
 * @param {boolean} [allowEmpStr] If `false`, return empty array if isString(v) and isEmpty(v)
 * @returns {Array<NonNullable<T>>}
 */
const asArray = (v, shallow, allowEmpStr) => /** @type {Array} */(
    (v instanceof Set ? Array.from(v): (isArray(v) ? (shallow !== true ? v : v.slice()) : (!isEmpty(v, allowEmpStr) ? [ v ] : [])))
);


/**
 * @param {string} value
 * @returns {string}
 */
const capitalize = (value) =>
{
    if (value) {
        value = value.charAt(0).toUpperCase() + value.substring(1);
    }
    if (value === "Webapp") { value = "WebApp"; }
    else if (value === "Webmodule") { value = "WebModule"; }
    return value || '';
};


// /**
//  * @param {string} value
//  * @returns {string}
//  */
// const uncapitalize = (value) =>
// {
//     if (value) {
//         value = value.charAt(0).toLowerCase() + value.substr(1);
//     }
//     return value || '';
// };


// /**
//  * @param {string} value
//  * @param {number} length
//  * @param {string} word
//  * @returns {string}
//  */
// const ellipsis = (value, length, word) =>
// {
//     if (value && value.length > length)
//     {
//         if (word) {
//             const vs = value.substring(0, length - 2),
//                 index = Math.max(vs.lastIndexOf(' '), vs.lastIndexOf('.'), vs.lastIndexOf('!'), vs.lastIndexOf('?'));
//             if (index !== -1 && index >= (length - 15)) {
//                 return vs.substring(0, index) + "...";
//             }
//         }
//         return value.substring(0, length - 3) + "...";
//     }
//     return value;
// };


/**
 * @function
 * @template T
 * @param {any} item
 * @returns {T}
 */
const clone = (item) =>
{
    if (!item) {
        return item;
    }
    if (isDate(item)) {
        return /** @type {T} */(new Date(item.getTime()));
    }
    if (isArray(item))
    {
        let i = item.length;
        const c = [];
        while (i--) { c[i] = clone(item[i]); }
        return /** @type {T} */(c);
    }
    if (isObject(item))
    {
        const c = {};
        Object.keys((item)).forEach((key) =>
        {
            c[key] = clone(item[key]);
        });
        return /** @type {T} */(c);
    }
    return item;
};


/**
 * Executes a command with a promisified child_process.exec()
 *
 * @function
 * @param {object} options
 * @property {string} command command to execute, with arguments
 * @property {import("child_process").ExecOptions} [execOptions] options to pass to child_process.exec()
 * @property {string | string[]} [ignoreOut] stdout or stderr lines to ignore
 * @property {string} [program] program name to diasplay in any logging
 * @property {typedefs.WpBuildConsoleLogger} logger a WpBuildConsoleLogger instance
 * @property {string} [logPad] a padding to prepend any log messages with
 * @returns {Promise<number | null>}
 */
const execAsync = async (options) =>
{
    let exitCode = null;
    const procPromise = exec(options.command, { stdio: [ "pipe", "pipe", "pipe" ], encoding: "utf8", ...options.execOptions }),
          child = procPromise.child,
          ignores = asArray(options.ignoreOut),
          logPad = options.logPad || "",
          logger = options.logger,
          colors = logger.colors,
          stdout = [], stderr = [],
          program = options.program || options.command.split(" ")[0];

    const _handleOutput = (out, stdarr) =>
    {
        const outs = out.split("\n");
        outs.filter(o => !!o).map(o => o.toString().trim()).forEach((o) =>
        {
            if (ignores.every(i => !o.includes(i)))
            {
                if (o.startsWith(":") && stdarr.length > 0) {
                    stdarr[stdarr.length - 1] = stdarr[stdarr.length -1] + o;
                }
                else if (stdarr.length > 0 && stdarr[stdarr.length - 1].endsWith(":")) {
                    stdarr[stdarr.length - 1] = stdarr[stdarr.length -1] + " " + o;
                }
                else {
                    stdarr.push(o);
                }
            }
        });
    };

    child.stdout?.on("data", (data) => _handleOutput(data, stdout));
    child.stderr?.on("data", (data) => _handleOutput(data, stderr));

    child.on("close", (code) =>
    {
        exitCode = code;
        const clrCode = logger.withColor(code?.toString(), code === 0 ? colors.green : colors.red);
        const _out = (name, out) =>
        {
            if (out.length > 0)
            {
                const hdr = logger.withColor(`${program} ${name}:`, exitCode !== 0 ? colors.red : colors.yellow);
                stderr.forEach((m) =>
                {
                    const msg = logger.withColor(m, colors.grey),
                        lvl = m.length <= 256 ? 1 : (m.length <= 512 ? 2 : (m.length <= 1024 ? 3 : 5));
                    logger.log(
                        `${logPad}${hdr} ${msg}`, lvl, "",
                        exitCode !== 0 ? logger.icons.color.error : logger.icons.color.warning
                    );
                });
            }
        };
        _out("stdout", stdout);
        _out("stderr", stderr);
        logger.log(`${logPad}${program} completed with exit code bold(${clrCode})`);
    });

    await procPromise;
    return exitCode;
};


/**
 * @function
 * @param {string} pattern
 * @param {import("glob").GlobOptions} options
 * @returns {Promise<string[]>}
 */
const findFiles = async (pattern, options) => (await glob(pattern, merge(globOptions, options))).map((f) => f.toString());


/**
 * @function
 * @param {string} pattern
 * @param {import("glob").GlobOptions} options
 * @returns {string[]}
 */
const findFilesSync = (pattern, options) => glob.sync(pattern, merge(globOptions, options)).map((f) => f.toString());


/**
 * @param {import("../types/typedefs").WpBuildApp} app
 * @returns {string | undefined}
 */
const findTsConfig = (app) =>
{
    /**
     * @param {string} base
     * @returns {string | undefined}
     */
    const _find = (base) =>
    {
        let tsCfg = join(base, `tsconfig.${app.build.name}.json`);
        if (!existsSync(tsCfg))
        {
            tsCfg = join(base, `tsconfig.${app.build.target}.json`);
            if (!existsSync(tsCfg))
            {
                tsCfg = join(base, `tsconfig.${app.build.mode}.json`);
                if (!existsSync(tsCfg))
                {
                    tsCfg = join(base,`tsconfig.${app.build.type}.json`);
                    if (!existsSync(tsCfg))
                    {
                        tsCfg = join(base, app.build.name, "tsconfig.json");
                        if (!existsSync(tsCfg))
                        {
                            tsCfg = join(base, app.build.type || app.build.name, "tsconfig.json");
                            if (!existsSync(tsCfg)) {
                                tsCfg = join(base,"tsconfig.json");
                            }
                        }
                    }
                }
            }
        }
        return tsCfg;
    };

    let tsConfig = app.paths.tsconfig;
    if (!tsConfig || !existsSync(tsConfig))
    {
        tsConfig = _find(app.getSrcPath());
        if (!tsConfig || !existsSync(tsConfig)) {
            tsConfig = _find(app.getContextPath());
            if (!tsConfig || !existsSync(tsConfig)) {
                tsConfig = _find(app.getRcPath("base"));
            }
        }
    }

    if (tsConfig && existsSync(tsConfig)) {
        return tsConfig;
    }
};


/**
 * @param {import("../types/typedefs").WpBuildApp | string} app
 * @param {string[]} xInclude
 * @returns {typedefs.WpBuildAppTsConfig | undefined}
 */
const getTsConfig = (app, ...xInclude) =>
{
    const tsConfigPath = isString(app) ? app : findTsConfig(app);
    if (tsConfigPath && existsSync(tsConfigPath))
    {
        const dir = dirname(tsConfigPath),
              file = basename(tsConfigPath),
            result = spawnSync("npx", [ "tsc", `-p ${file}`, "--showConfig" ], { cwd: dir, encoding: "utf8", shell: true }),
            data = result.stdout,
            start = data.indexOf("{"),
            end = data.lastIndexOf("}") + 1,
            include = [ ...xInclude ],
            raw = data.substring(start, end),
            json = JSON5.parse(raw);
        if (json.rootDir) {
            include.push(resolve(dir, json.rootDir));
        }
        if (isArray(json.include)) {
            include.push(...json.include.filter(p => !include.includes(p)).map((path) => resolve(dir, path.replace(/\*/g, ""))));
        }
	    return { raw, json, include: uniq(include), path: tsConfigPath };
    }
};


/**
 * @template T
 * @param {T} v Variable to check to see if it's an array
 * @param {boolean} [allowEmp] If `true`, return true if v is an empty array
 * @returns {v is T[]}
 */
const isArray = (v, allowEmp) => !!v && Array.isArray(v) && (allowEmp !== false || v.length > 0);


/**
 * @param {any} v Variable to check to see if it's a Date instance
 * @returns {v is Date}
 */
const isDate = (v) => !!v && Object.prototype.toString.call(v) === "[object Date]";


/**
 * @param {any} v Variable to check to see if it's an array
 * @param {boolean} [allowEmpStr] If `true`, return non-empty if isString(v) and v === ""
 * @returns {v is null | undefined | "" | []}
 */
const isEmpty = (v, allowEmpStr) => v === null || v === undefined || (!allowEmpStr ? v === "" : false) || (isArray(v) && v.length === 0) || (isObject(v) && isObjectEmpty(v));


/**
 * @param {any} v Variable to check to see if it's and empty object
 * @returns {boolean}
 */
const isFunction = (v) => !!v && typeof v === "function";


/**
 * @template {{}} [T=Record<string, any>]
 * @param {T | undefined} v Variable to check to see if it's an array
 * @param {boolean} [allowArray] If `true`, return true if v is an array
 * @returns {v is T}
 */
const isObject = (v, allowArray) => !!v && Object.prototype.toString.call(v) === "[object Object]" && (v instanceof Object || typeof v === "object") && (allowArray || !isArray(v));


/**
 * @param {any} v Variable to check to see if it's and empty object
 * @returns {boolean}
 */
const isObjectEmpty = (v) => { if (v) { return Object.keys(v).filter(k => ({}.hasOwnProperty.call(v, k))).length === 0; } return true; };


/**
 * @param {any} v Variable to check to see if it's a primitive type (i.e. boolean / number / string)
 * @returns {v is boolean | number | string}
 */
const isPrimitive = (v) => [ "boolean", "number", "string" ].includes(typeof v);


/**
 * @template T
 * @param {PromiseLike<T> | any} v Variable to check to see if it's a promise or thenable-type
 * @returns {v is PromiseLike<T>}
 */
const isPromise = (v) => !!v && (v instanceof Promise || (isObject(v) && isFunction(v.then)));


/**
 * @param {any} v Variable to check to see if it's an array
 * @param {boolean} [notEmpty] If `false`, return false if v is a string of 0-length
 * @returns {v is string}
 */
const isString = (v, notEmpty) => (!!v || (v === "" && !notEmpty)) && (v instanceof String || typeof v === "string");


/**
 * @function
 * @template {{}} T
 * @template {{}} U extends T
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} destination
 * @returns {T}
 */
const merge = (...destination) =>
{
    const ln = destination.length,
          base = destination[0] || {};
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i] || {};
        Object.keys(object).filter(key => ({}.hasOwnProperty.call(object, key))).forEach((key) =>
        {
            const value = object[key];
            if (isObject(value))
            {
                const sourceKey = base[key];
                if (isObject(sourceKey))
                {
                    merge(sourceKey, value);
                }
                // else if (isArray(sourceKey) && isArray(value)) {
                //     base[key] = [ ...sourceKey, ...clone(value) ];
                // }
                else {
                    base[key] = clone(value);
                }
            }
            else {
                base[key] = value;
            }
        });
    }
    return /** @type {T} */(base);
};


/**
 * @function
 * @template {{}} [T=Record<string, any>]
 * @param {...(T | Partial<T> | undefined)} destination
 * @returns {T}
 */
const mergeIf = (...destination) =>
{
    const ln = destination.length,
          base = destination[0] || {};
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i] || {};
        for (const key in object)
        {
            if (!(key in base))
            {
                const value = /** @type {Partial<T>} */(object[key]);
                if (isObject(value))
                {
                    base[key] = clone(value);
                }
                else {
                    base[key] = value;
                }
            }
        }
    }
    return /** @type {T} */(base);
};


/**
 * @function
 * @template {{}} [T=Record<string, any>]
 * @param {T} obj
 * @param {...string} keys
 * @returns {T}
 */
const pick = (obj, ...keys) =>
{
    const ret = {};
    keys.forEach(key => { ret[key] = obj[key]; });
    return /** @type {T} */(ret);
};


/**
 * @function
 * @template {Record<string, T>} T
 * @param {T} obj
 * @param {(arg: string) => boolean} pickFn
 * @returns {Partial<T>}
 */
const pickBy = (obj, pickFn) =>
{
    const ret = {};
    Object.keys(obj).filter(k => pickFn(k)).forEach(key => ret[key] = obj[key]);
    return ret;
};


/**
 * @function
 * @template {{}} T
 * @template {keyof T} K
 * @param {T} obj
 * @param {...K} keys
 * @returns {Omit<T, K>}
 */
const pickNot = (obj, ...keys) =>
{
    const ret = { ...obj };
    keys.forEach(key => { delete ret[key]; });
    return ret;
};


/**
 * @function
 * @template T
 * @param {T[]} a
 * @returns {T[]}
 */
const uniq = (a) => a.sort().filter((item, pos, arr) => !pos || item !== arr[pos - 1]);


class WpBuildError extends WebpackError
{
    /**
     * @class WpBuildError
     * @param {string} message
     * @param {string} file
     * @param {string} [details]
     * @param {boolean} [capture]
     */
    constructor(message, file, details, capture)
    {
        super(message);
        this.file = file;
        this.details = details;
        // Object.setPrototypeOf(this, new.target.prototype);
        if (capture !== false) {
            WpBuildError.captureStackTrace(this, this.constructor);
        }
    }


    /**
     * @param {string} message
     * @param {string} file
     * @param {Partial<typedefs.WpBuildWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static get(message, file, wpc, detail)
    {
        if (wpc) {
            if (wpc.mode) {
                message += ` | mode:[${wpc.mode}]`;
            }
            if (wpc.target) {
                message += ` | target:[${wpc.mode}]`;
            }
        }
        message += ` | [${file}]`;
        if (isString(detail)) {
            message += ` | ${detail}`;
        }
        const e =new WpBuildError(message, file, detail ?? undefined, false);
        WpBuildError.captureStackTrace(e, this.get);
        return e;
    }


    /**
     * @param {string} property
     * @param {string} file
     * @param {Partial<typedefs.WpBuildWebpackConfig>  | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorMissing = (property, file, wpc, detail) =>
        this.get(`Could not locate wpbuild resource '${property}' environment'${property}'`, file, wpc, detail);


    /**
     * @param {string} property
     * @param {string} file
     * @param {Partial<typedefs.WpBuildWebpackConfig>  | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorProperty = (property, file, wpc, detail) =>
        this.get(`Invalid build configuration - property '${property}', file, wpc, shortDesc`, file, wpc, detail);

}


module.exports = {
    apply, asArray, capitalize, clone, execAsync, findFiles, findFilesSync, findTsConfig, getTsConfig,
    isArray, isDate,isEmpty, isFunction, isObject, isObjectEmpty,isPrimitive, isPromise, isString,
    merge, mergeIf, pick, pickBy, pickNot, uniq, WpBuildError
};

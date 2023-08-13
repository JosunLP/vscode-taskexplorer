/* eslint-disable @typescript-eslint/naming-convention */
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
const { WebpackError } = require("webpack");
const { spawnSync } = require("child_process");

/** @typedef {import("../types").WpBuildWebpackConfig} WpBuildWebpackConfig */


/**
 * @function
 * @template {{}} [T=Record<string, any>]
 * @param {T | Partial<T>} object
 * @param {T | Partial<T> | undefined} config
 * @param {T | Partial<T> | undefined} [defaults]
 * @returns {T}
 */
const apply = (object, config, defaults) =>
{
    if (object)
    {
        if (defaults) {
            apply(object, defaults);
        }
        if (config && isObject(config)) {
            Object.keys(config).forEach((i) => { object[i] = config[i]; });
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
 * @function
 * @param {string} pattern
 * @param {import("glob").GlobOptions} options
 * @returns {Promise<string[]>}
 */
const findFiles = async (pattern, options) => (await glob(pattern, options)).map((/** @type {{ toString: () => any; }} */ f) => f.toString());


/**
 * @function
 * @param {string} pattern
 * @param {import("glob").GlobOptions} options
 * @returns {string[]}
 */
const findFilesSync = (pattern, options) => glob.sync(pattern, options).map((/** @type {{ toString: () => any; }} */ f) => f.toString());


/**
 * @param {string} baseDir Webpack build environment
 * @param {string} tsConfigFile
 * @returns {Record<string, any>}
 */
const getTsConfig = (baseDir, tsConfigFile) =>
{
	const result = spawnSync("npx", [ "tsc", `-p ${tsConfigFile}`, "--showConfig" ], {
		cwd: baseDir,
		encoding: "utf8",
		shell: true,
	});
	const data = result.stdout,
		  start = data.indexOf("{"),
		  end = data.lastIndexOf("}") + 1;
	return JSON5.parse(data.substring(start, end));
};


/**
 * @param {any} v Variable to check to see if it's an array
 * @param {boolean} [allowEmp] If `true`, return true if v is an empty array
 * @returns {v is []}
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
 * @template {{}} [T=Record<string, any>]
 * @param {...(T | Partial<T> | undefined)} destination
 * @returns {T}
 */
const merge = (...destination) =>
{
    const ln = destination.length,
          base = destination[0] || {};
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i] || {};
        Object.keys(object).forEach((key) =>
        {
            const value = object[key];
            if (isObject(value))
            {
                const sourceKey = base[key];
                if (isObject(sourceKey))
                {
                    merge(sourceKey, value);
                }
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
 * @template {{}} [O=Record<string, any>]
 * @template {Record<string, any>} [T=Record<string, any>]
 * @param {O} obj
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
 * @template {Record<string, T>} T
 * @param {T} obj
 * @param {...string} keys
 * @returns {Partial<T>}
 */
const pickNot = (obj, ...keys) =>
{
    const ret = { ...obj };
    keys.forEach(key => { delete ret[key]; });
    return ret;
};


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
     * @param {Partial<WpBuildWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static get(message, file, wpc, detail)
    {
        if (wpc) {
            if (wpc.mode) {
                message += ` | mode:[${wpc.mode}]`;
            }
        }
        if (isString(detail)) {
            message += `: ${detail}`;
        }
        message += ` | [${file}]`;
        const e =new WpBuildError(message, file, detail ?? undefined, false);
        WpBuildError.captureStackTrace(e, this.get);
        return e;
    }

    /**
     * @param {string} property
     * @param {string} file
     * @param {Partial<WpBuildWebpackConfig>  | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorMissing = (property, file, wpc, detail) =>
        this.get(`Could not locate wpbuild resource '${property}' environment'${property}'`, file, wpc, detail);

    /**
     * @param {string} property
     * @param {string} file
     * @param {Partial<WpBuildWebpackConfig>  | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorProperty = (property, file, wpc, detail) =>
        this.get(`Invalid build configuration - property '${property}', file, wpc, shortDesc`, file, wpc, detail);

}


module.exports = {
    apply, asArray, clone, findFiles, findFilesSync, getTsConfig, isArray, isDate, isEmpty, isFunction,
    isObject, isObjectEmpty,isPrimitive, isPromise, isString, merge, mergeIf, pick, pickBy, pickNot,
    WpBuildError
};


import { Uri, WorkspaceFolder } from "vscode";
import { IDictionary, Primitive } from "../../interface";

/**
 * @param v Variable to check to see if it's an array
 * @param shallow If `true`, and  `arr` is an array, return a shallow copy
 */
export const asArray = <T>(v: T | T[] | undefined | null, shallow?: boolean, allowEmpStr?: boolean): T[] => (isArray<T>(v) ? (shallow !== true ? v : v.slice()) : (!isEmpty(v, allowEmpStr) ? [ v ] : []));


// export const asObject = <T>(v: T | undefined | null): T => isObject<T>(v) ? v : <T>{};


// export const asString = (v: string | undefined | null, defaultValue = ""): string => isString(v) ? v : defaultValue;


export const isArray = <T>(v: any, allowEmp?: boolean): v is T[] => !!v && Array.isArray(v) && (allowEmp !== false || v.length > 0);


// export const isAsyncFunction = <T = any>(fn: any): fn is () => PromiseLike<T> => types.isAsyncFunction(fn);


export const isBoolean = (v: any): v is boolean => (v === false || v === true) && typeof v === "boolean";


// export const isDate = (v: any): v is Date => !!v && Object.prototype.toString.call(v) === "[object Date]";


// export const isDefined = (v: any) => typeof v !== "undefined";


export const isEmpty = (v: any, allowEmpStr?: boolean): v is null | undefined | "" | [] => v === null || v === undefined || (!allowEmpStr ? v === "" : false) || (isArray(v) && v.length === 0);


export const isError = (e: any): e is Error => e instanceof Error;


export const isFunction = (v: any) => !!v && typeof v === "function";


export const isNumber = (v: any): v is number => (v || v === 0) && typeof v === "number" && isFinite(v);


// export const isNumeric = (v: any) => !isNaN(parseFloat(v)) && isFinite(v);


export const isObject = <T = IDictionary<any>>(v: any, allowArray?: boolean): v is T => !!v && (v instanceof Object || typeof v === "object") && (allowArray || !isArray<any>(v));


export const isObjectEmpty = (v: IDictionary<any>): boolean => { if (v) { return Object.keys(v).filter(k => ({}.hasOwnProperty.call(v, k))).length === 0; } return true; };


export const isPrimitive = (v: any): v is Primitive => [ "boolean", "number", "string" ].includes(typeof v);


export const isPromise = <T>(v: any): v is PromiseLike<T> => !!v && (v instanceof Promise || (isObject(v) && isFunction(v.then)));


export const isString = (v: any, notEmpty = false): v is string => (!!v || (v === "" && !notEmpty)) && (v instanceof String || typeof v === "string");


export const isUri = (v: any): v is Uri => !!v && v instanceof Uri;


export const isWorkspaceFolder = (v: any): v is WorkspaceFolder => v && typeof v !== "number";

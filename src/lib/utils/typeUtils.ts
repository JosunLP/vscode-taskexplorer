
import { types } from "util";
import { Uri, WorkspaceFolder } from "vscode";


export const isArray = <T>(v: any): v is T[] => !!v && Array.isArray(v);


export const isAsyncFunction = <T = any>(fn: any): fn is PromiseLike<T> => types.isAsyncFunction(fn);


export const isBoolean = (v: any): v is boolean => (v === false || v === true) && typeof v === "boolean";


// export const isDefined = (v: any) => typeof v !== "undefined";


export const isError = (e: any): e is Error => e instanceof Error;


export const isFunction = (v: any) => !!v && typeof v === "function";


export const isNumber = (v: any): v is number => (v || v === 0) && typeof v === "number" && isFinite(v);


export const isObject = (v: any): v is { [key: string]: any } => !!v && (v instanceof Object || typeof v === "object") && !isArray(v);


export const isObjectEmpty = (v: any) =>
{
    if (v)
    {
        for (const key in v)
        {
            if ({}.hasOwnProperty.call(v, key)) {
                return false;
            }
        }
    }
    return true;
};


export const isString = (v: any, notEmpty = false): v is string =>
    (!!v || (v === "" && !notEmpty)) && (v instanceof String || typeof v === "string");


export const isUri = (v: any): v is Uri => !!v && v instanceof Uri;


export const isWorkspaceFolder = (v: any): v is WorkspaceFolder => v && typeof v !== "number";

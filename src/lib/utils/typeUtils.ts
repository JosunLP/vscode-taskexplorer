import { Uri, WorkspaceFolder } from "vscode";

export const isArray = <T>(value: any): value is T[] => !!value && Array.isArray(value);


export const isBoolean = (value: any): value is boolean => (value === false || value === true) && typeof value === "boolean";


export const isError = (e: any): e is Error => e instanceof Error;


export const isFunction = (value: any) => !!value && typeof value === "function";


export const isNumber = (n: any): n is number => (n || n === 0) && typeof n === "number" && isFinite(n);


export const isObject = (value: any): value is { [key: string]: any } => !!value && (value instanceof Object || typeof value === "object") && !isArray(value);


export const isObjectEmpty = (value: any) =>
{
    if (value)
    {
        for (const key in value)
        {
            if ({}.hasOwnProperty.call(value, key)) {
                return false;
            }
        }
    }
    return true;
};


export const isString = (value: any, notEmpty = false): value is string =>
    (!!value || (value === "" && !notEmpty)) && (value instanceof String || typeof value === "string");


export const isUri = (u: any): u is Uri => !!u && u instanceof Uri;


export const isWorkspaceFolder = (value: any): value is WorkspaceFolder => value && typeof value !== "number";

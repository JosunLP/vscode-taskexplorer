/* eslint-disable no-redeclare */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Strings } from "../constants";
import minimatch = require("minimatch");
import { basename, extname, sep } from "path";
import { configuration } from "../configuration";
import { Uri, workspace, env, WorkspaceFolder } from "vscode";
import { isArray, isFunction, isPromise, isString } from "./typeUtils";
import { ConfigKeys, CallbackOptions, CallbackArray, ILog } from "../../interface";


const tzOffset = (new Date()).getTimezoneOffset() * 60000;


export const cloneJsonObject = <T>(jso: any) => JSON.parse(JSON.stringify(jso)) as T;


export function execIf<T, R>(checkValue: T | undefined, ifFn: (arg: T) => R, thisArg?: any, elseOpts?: CallbackOptions): R | undefined;
export function execIf<T, R, A1>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
export function execIf<T, R, A1, A2>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
export function execIf<T, R, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
export function execIf<T, R, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
export function execIf<T, R, A1, A2, A3, A4, A5>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
export function execIf<T, R, A1, A2 = A1, A3 = A1, A4 = A1, A5 = A1>(checkValue: T | undefined, ifFn: (arg: T, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5) => R, thisArg?: any, elseOpts?: CallbackOptions, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5): R | undefined
{
    if (checkValue) {
        return ifFn.call(thisArg, checkValue, arg1, arg2, arg3, arg4, arg5);
    }
    else if (isCallbackArray(elseOpts)) {
        return elseOpts.splice(0, 1)[0].call(thisArg, ...elseOpts, arg1, arg2, arg3, arg4, arg5);
    }
};
/*
export function execIf<T, R, A0>(checkValue: T | undefined, ifFn: (arg: T) => R, thisArg?: any, elseOpts?: CallbackOptions | A0 | null | undefined): R | undefined;
export function execIf<T, R, A0, A1>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions | A0 | null | undefined, arg1: A1): R | undefined;
export function execIf<T, R, A0, A1, A2>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions | A0 | null | undefined, arg1: A1, arg2: A2): R | undefined;
export function execIf<T, R, A0, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions | A0 | null | undefined, arg1: A1, arg2: A2, arg3: A3): R | undefined;
export function execIf<T, R, A0, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions | A0 | null | undefined, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
export function execIf<T, R, A0, A1, A2, A3, A4, A5>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions | A0 | null | undefined, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
export function execIf<T, R, A0 = any, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1>(checkValue: T | undefined, ifFn: (arg: T, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5) => R, thisArg?: any, elseOpts?: CallbackOptions | A0 | null | undefined, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5): R | undefined
{
    if (checkValue) {
        return ifFn.call(thisArg, checkValue, arg1, arg2, arg3, arg4, arg5);
    }
    else if (isCallbackArray(elseOpts)) {
        return elseOpts.splice(0, 1)[0].call(thisArg, ...elseOpts);
    }
};
export function execIf<T extends CheckValue, R>(checkValue: T, ifFn: (arg: T) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
export function execIf<T extends CheckValue, R, A1>(checkValue: T, ifFn: (arg: T, arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
export function execIf<T extends CheckValue, R, A1, A2>(checkValue: T, ifFn: (arg: T, arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
export function execIf<T extends CheckValue, R, A1, A2, A3>(checkValue: T, ifFn: (arg: T, arg1: A1, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
export function execIf<T extends CheckValue, R, A1, A2, A3, A4>(checkValue: T, ifFn: (arg: T, arg1: A1, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
export function execIf<T extends CheckValue, R, A1, A2, A3, A4, A5>(checkValue: T, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
export function execIf<T extends CheckValue, R, A1, A2 = A1, A3 = A1, A4 = A1, A5 = A1>(checkValue: T, ifFn: (arg: T, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5) => R, thisArg?: any, elseOpts?: CallbackOptions, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5): R | undefined
{
    let elseFn: CallbackOptions;
    const checkValueIsParams = isArray(checkValue, false) && checkValue.length === 2;
    if (isCallbackArray(elseOpts)) {
        elseFn = elseOpts;
    }
    if ((!checkValueIsParams && checkValue) || (checkValueIsParams ? checkValue[0] : null)) {
        return ifFn.call(thisArg, !checkValueIsParams ? checkValue : checkValue[1] as T, arg1, arg2, arg3, arg4, arg5);
    }
    else if (elseFn) {
        return elseFn.splice(0, 1)[0].call(thisArg, ...elseFn);
    }
};
*/
export function execIf2<T, R, A1>(checkValue: T | undefined, ifFn: (arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
export function execIf2<T, R, A1, A2>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
export function execIf2<T, R, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
export function execIf2<T, R, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
export function execIf2<T, R, A1, A2, A3, A4, A5>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
export function execIf2<T, R, A1, A2, A3, A4, A5, A6>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6): R | undefined;
export function execIf2<T, R, A1, A2, A3, A4, A5, A6, A7>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7): R | undefined;
export function execIf2<T, R, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1, A6 = A1, A7 = A1>(checkValue: T | undefined, ifFn: (arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5, arg6?: A6, arg7?: A7) => R, thisArg?: any, elseOpts?: CallbackOptions, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5, arg6?: A6, arg7?: A7): R | undefined
{
    if (checkValue) {
        return ifFn.call(thisArg, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }
    else if (isCallbackArray(elseOpts)) {
        return elseOpts.splice(0, 1)[0].call(thisArg, ...elseOpts, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }
};


export const formatDate = (epochMs: number, format?: "datetime" | "date" | "time") =>
{
    const t = (new Date(epochMs - tzOffset)).toISOString().slice(0, -1).split("T");
    return (!format || format === "datetime" ? `${t[0]} ${t[1]}` : (format === "date" ? t[0] : t[1]));
};


export const getCombinedGlobPattern = (defaultPattern: string, globs: string[]) =>
{
    if (globs && globs.length > 0)
    {
        let multiFilePattern = "{" + defaultPattern;
        for (const i of globs) {
            multiFilePattern += ",";
            multiFilePattern += i;
        }
        multiFilePattern += "}";
        return multiFilePattern;
    }
    return defaultPattern;
};


export const getDateDifference = (date1: Date | number, date2: Date | number, type?: "d" | "h" | "m" | "s") =>
{
	const differene = (typeof date2 === "number" ? date2 : date2.getTime()) - (typeof date1 === "number" ? date1 : date1.getTime());
	switch (type)
    {
		case "s":
			return Math.floor(differene / 1000);
        case "m":
            return Math.floor(differene / (1000 * 60));
        case "h":
            return Math.floor(differene / (1000 * 60 * 60));
		case "d":
			return Math.floor(differene / (1000 * 60 * 60 * 24));
		default:
			return differene;
	}
};


export const getGroupSeparator = () => configuration.get<string>(ConfigKeys.GroupSeparator, Strings.DEFAULT_SEPARATOR);


export const getPackageManager = () =>
{
    let pkgMgr = workspace.getConfiguration("npm", null).get<string>("packageManager") || "npm";
    if (pkgMgr.match(/(npm|auto)/)) { // pnpm/auto?  only other option is yarn
        pkgMgr = "npm";
    }
    return pkgMgr;
};


/**
 * Get a random integer betwen min and max, inclusive
 *
 * @since 3.0.0
 * @param [max=100000] The maximum number to return
 * @param [min=0] The minimum number to return
 */
export const getRandomNumber = (max = 100000, min = 0) =>
{
    const rnd = Math.random();
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(rnd * (max - min + 1) + min);
};


export const getWorkspaceProjectName = (fsPath: string) =>
{
    const wsf = workspace.getWorkspaceFolder(Uri.file(fsPath));
    return basename((wsf as WorkspaceFolder).uri.fsPath);
};


export const isTeEnabled = () => configuration.get<boolean>(ConfigKeys.EnableSideBar) ||
                                 configuration.get<boolean>(ConfigKeys.EnableExplorerTree);


export const isExcluded = (uriPath: string, log: ILog, logPad = "") =>
{
    const exclude = uniq(configuration.get<string[]>("exclude", []));
    log.methodStart("Check exclusion", 4, logPad, false, [[ "path", uriPath ]]);
    for (const pattern of exclude)
    {
        log.value("   checking pattern", pattern, 5);
        if (testPattern(uriPath, pattern))
        {
            log.methodDone("Check exclusion", 4, logPad, [[ "excluded", "yes" ]]);
            return true;
        }
        if (!extname(uriPath) && !uriPath.endsWith(sep))
        {
            if (testPattern(uriPath + sep, pattern))
            {
                log.methodDone("Check exclusion", 4, logPad, [[ "excluded", "yes" ]]);
                return true;
            }
        }
    }
    log.methodDone("Check exclusion", 4, logPad, [[ "excluded", "no" ]]);
    return false;
};


const isCallbackArray = <T = any>(v: any): v is CallbackArray<T> => !!v && isArray(v) && isFunction(v[0]);


/**
 * @param taskType Task type, e.g. `npm`, `apppublisher`, `grunt`, `bash`, etc
 * @returns `true` if enabled, `false` if disabled
 */
export const isTaskTypeEnabled = (taskType: string) =>
{
    const settingName = "enabledTasks." + taskType.replace(/\-/g, "").toLowerCase();
    return configuration.get<boolean>(settingName, false);
};


export const lowerCaseFirstChar = (s: string, removeSpaces: boolean) =>
{
    let fs = "";
    if (s)
    {
        fs = s[0].toString().toLowerCase();
        if (s.length > 1) {
            fs += s.substring(1);
        }
        if (removeSpaces) {
            fs = fs.replace(/ /g, "");
        }
    }
    return fs;
};


export const openUrl = (url: string) => env.openExternal(Uri.parse(url));


export const pushIfNotExists = (arr: string[] | undefined, ...item: string[]) => { if (arr) { item.forEach(i => { if (!arr.includes(i)) { arr.push(i); } }); return arr; }};


// export const pushIfNotExistsBy = <T>(arr: T[] | undefined, fn: (v: T) => boolean, thisArg?: any, ...item: T[]) => { if (arr) { item.forEach(i => { if (fn.call(thisArg, i)) { arr.push(i); } }); return arr; }};


export const popIfExists = (arrOrRec: string[] | Record<string, string> | undefined, ...item: string[]): string[] =>
{
    const popped: string[] = [];
    if (arrOrRec)
    {
        if (item.length > 1)
        {
            if (isArray(arrOrRec)) {
                arrOrRec.slice().reverse().forEach((v, i, a) => { if (item.includes(v)) { popped.push(...arrOrRec.splice(a.length - 1 - i, 1)); } });
            }
            else {
                Object.entries(arrOrRec).filter(e => item.find(i => i === e[0] || i === e[1])).forEach(e => { popped.push(e[1]); delete arrOrRec[e[0]]; });
            }
        }
        else
        {
            if (isArray(arrOrRec))
            {
                const idx = arrOrRec.findIndex(v => v === item[0]);
                if (idx !== -1) {
                    popped.push(arrOrRec.splice(idx, 1)[0]);
                }
            }
            else
            {
                if (isString(arrOrRec[item[0]]))
                {
                    popped.push(arrOrRec[item[0]]);
                    delete arrOrRec[item[0]];
                }
            }
        }
    }
    return popped;
};


export const popIfExistsBy = <T>(arr: T[] | undefined, fn: (v1: T) => boolean, thisArg?: any, single = false): T[] =>
{
    const popped: T[] = [];
    if (arr)
    {
        if (!single)
        {
            arr.slice().reverse().forEach((v, i, a) => { if (fn.call(thisArg, v)) { popped.push(...arr.splice(a.length - 1 - i, 1)); } });
        }
        else {
            const idx = arr.findIndex(v => fn.call(thisArg, v));
            if (idx !== -1) {
                popped.push(arr.splice(idx, 1)[0]);
            }
        }
    }
    return popped;
};


export const popObjIfExistsBy = <T>(rec: Record<string, T> | undefined, fn: (k: string, v: T) => boolean, thisArg?: any, single = false): T[] =>
{
    const popped: T[] = [];
    if (rec)
    {
        Object.entries<T>(rec).every(e => { if (fn.call(thisArg, e[0], e[1])) { popped.push(e[1]); delete rec[e[0]]; return !single; } return true; });
    }
    return popped;
};


// export const pluralize = (s: string, count: number) => `${count} ${s}${count === 1 ? "" : "s"}`;


// export const removeFromArray = <T>(arr: T[], cb: (value: any, index: number, array: T[]) => void)
// {
//     const shallowReverse = arr.slice().reverse();
//     for (const item of shallowReverse)
//     {
//         fn(item, index, object);
//     }
//     shallowReverse.forEach((item, index, object) =>
//     {
//         fn(item, index, object);
//     });
// };

export const removeFromArray = (arr: any[], item: any) =>
{
    let idx = -1;
    let idx2 = -1;

    if (!arr.includes(item)) {
        return;
    }

    for (const each of arr)
    {
        idx++;
        if (item === each) {
            idx2 = idx;
            break;
        }
    }

    /* istanbul ignore else */
    if (idx2 !== -1 && idx2 < arr.length) {
        arr.splice(idx2, 1);
    }
};


// // Removes \ / : * ? " < > | and C0 and C1 control codes
// // eslint-disable-next-line no-control-regex
// const illegalCharsForFSRegex = /[\\/:*?"<>|\x00-\x1f\x80-\x9f]/g;
//
// export function sanitizeForFileSystem(s: string, replacement: string = '_') {
// 	if (!s) return s;
// 	return s.replace(illegalCharsForFSRegex, replacement);
// }


export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));


export const testPattern = (path: string, pattern: string) => minimatch(path, pattern, { dot: true, nocase: true });


export const textWithElipsis = (text: string, maxLength: number) => text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;


export const uniq = <T>(a: T[]): T[] => a.sort().filter((item, pos, arr) => !pos || item !== arr[pos - 1]);


// export const upperCaseFirstChar = (text: string): string => text.replace(/(?:^\w|[A-Za-z]|\b\w)/g, (l, i) => (i !== 0 ? l : l.toUpperCase()));


export function wrap<R, E>(runFn: () => R, catchFn: CallbackOptions, thisArg?: any): R;
export function wrap<R, E, A1>(runFn: (arg1: A1) => R, catchFn: CallbackOptions, thisArg: any, arg1: A1): R;
export function wrap<R, E, A1, A2>(runFn: (arg1: A1, arg2: A2) => R, catchFn: CallbackOptions, thisArg: any, arg1: A1, arg2: A2): R;
export function wrap<R, E, A1, A2, A3>(runFn: (arg1: A1, arg2: A2, arg3: A3) => R, catchFn: CallbackOptions, thisArg: any, arg1: A1, arg2: A2, arg3: A3): R;
export function wrap<R, E, A1, A2, A3, A4>(runFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => R, catchFn: CallbackOptions, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R;
export function wrap<R, E, A1, A2, A3, A4, A5>(runFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, catchFn: CallbackOptions, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R;
export function wrap<R, E, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1>(runFn: (arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5) => R, catchFinallyOpts?: CallbackOptions, thisArg?: any, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5): R
{
    let result,
        failed = false;
    try
    {
        result = runFn.call(thisArg, arg1, arg2, arg3, arg4, arg5);
        if (isPromise<R>(result))
        {
            result = result.then<R, E>((r) => r, (e) =>
            {
                if (!isCallbackArray<E>(catchFinallyOpts)) {
                    result = (catchFinallyOpts || wrapThrow).call(thisArg, e);
                }
                else {
                    failed = true;
                    result = catchFinallyOpts.shift().call(thisArg, e, ...catchFinallyOpts);
                }
                if (isPromise<E>(result)) {
                    result = result.then<E, any>((e) => e, wrapThrow);
                }
                return result;
            });
        }
    }
    catch (e)
    {
        failed = true;
        if (!isCallbackArray<E>(catchFinallyOpts)) {
            result = (catchFinallyOpts || wrapThrow).call(thisArg, e);
        }
        else {
            result = catchFinallyOpts.shift().call(thisArg, e, ...catchFinallyOpts);
        }
        if (isPromise<E>(result)) {
            result = result.then<E, any>((e) => e, wrapThrow);
        }
    }
    finally
    {
        if (isCallbackArray<E>(catchFinallyOpts))
        {   //
            // If we failed, then the `catchFinallyOpts` array will have had it's 1st element removed
            //
            const fn = failed ? catchFinallyOpts[0] : catchFinallyOpts[1];
            if (isFunction(fn))
            {
                let fResult = fn.call(thisArg);
                if (isPromise<E>(fResult)) {
                    fResult = fResult.then<E, any>((e) => e, wrapThrow);
                }
            }
        }
    }
    return result;
};


const wrapThrow = <E>(e: E) => { throw(e); };

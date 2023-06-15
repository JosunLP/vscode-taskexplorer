
import { log } from "../log/log";
import minimatch = require("minimatch");
import { Strings } from "../constants";
import { ConfigKeys } from "../../interface";
import { basename, extname, sep } from "path";
import { configuration } from "../configuration";
import { Uri, workspace, env, WorkspaceFolder } from "vscode";


const tzOffset = (new Date()).getTimezoneOffset() * 60000;


export const cloneJsonObject = <T>(jso: any) => JSON.parse(JSON.stringify(jso)) as T;


export const execIf = <T, R = any>(checkValue: T | undefined, runFn: (arg: T, ...args: unknown[]) => R | PromiseLike<R>, thisArg?: any, ...args: unknown[]): R | PromiseLike<R> | undefined | void =>
{
    if (checkValue) {
        return runFn.call(thisArg, checkValue, ...args);
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


export const isExcluded = (uriPath: string, logPad = "") =>
{
    const exclude = configuration.get<string[]>("exclude", []);

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


export const openUrl = (url: string) =>
{
    log.methodOnce("homeview", "open url", 1, log.getLogPad(), [[ "url", url ]]);
    env.openExternal(Uri.parse(url));
};


export const pushIfNotExists = (arr: any[], item: any) => { if (!arr.includes(item)) { arr.push(item); } };


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

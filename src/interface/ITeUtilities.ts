
import { ILog } from "./ILog";
import { ITaskFile } from "./ITaskFile";
import { ITaskItem } from "./ITaskItem";
import { ITeWrapper } from "./ITeWrapper";
import { ITaskFolder } from "./ITaskFolder";
import { ITaskDefinition } from "./ITaskDefinition";
import { ITeTask, TeTaskListType, TeTaskSource } from "./ITeTask";
import { Event, EventEmitter, Task, WorkspaceFolder, Uri } from "vscode";


export interface IDictionary<TValue> { [id: string]: TValue }

export type Primitive = boolean | number | string;

export type OneOf<T, V extends any[], NK extends keyof V = Exclude<keyof V, keyof any[]>> = { [K in NK]: T extends V[K] ? V[K] : never }[NK];

export type PromiseAdapter<T, U> = (
    v: T,
    resolve:
        (v: U | PromiseLike<U>) => void,
    reject:
        (reason: any) => void
) => any;

export interface ITeCommonUtilities
{
	properCase(name: string | undefined, removeSpaces?: boolean): string;
}

export interface ObjectDiff
{
    previous: IDictionary<any>;
    current: IDictionary<any>;
}

// export interface ObjectUpdate {
//     oldValue: any;
//     newValue: any;
// }

export interface ITeObjectUtilities
{
    apply<T extends IDictionary<any>>(object: IDictionary<any>, config: IDictionary<any>, defaults?: IDictionary<any>): T;
    clone<T>(item: any): T;
    // diff(oldObj: IDictionary<any>, newObj: IDictionary<any>): ObjectDiff;
    // merge<T extends IDictionary<any>>(...destination: IDictionary<any>[]): T;
    // mergeIf<T extends IDictionary<any>>(...destination: IDictionary<any>[]): T;
    // pick<T extends Record<string, any>, K extends keyof T>(obj: T, ...keys: K[]): T;
    pickBy<T extends Record<string, any>>(obj: T, pickFn: <K extends keyof T>(k: K) => boolean | undefined): T ;
    // pickNot<T extends Record<string, any>, K extends keyof T>(obj: T, ...keys: K[]): T;
}

export interface ITePathUtilities
{
	getCwd(uri: Uri): string;
	getInstallPath(): Promise<string>;
	getInstallPathSync(): string;
	getRelativePath(folder: WorkspaceFolder, uri: Uri): string;
	getTaskAbsolutePath(task: Task, includeFileName?: boolean): string;
	getTaskFileName(source: string, taskDef: ITaskDefinition): string;
	getTaskRelativePath(task: Task): string;
	getUserDataPath(test?: boolean, platform?: string): string;
}

export interface ITePromiseUtilities
{
	oneTimeEvent<T>(event: Event<T>): Event<T>;
	promiseFromEvent<T, U>(event: Event<T>, adapter?: PromiseAdapter<T, U>): { promise: Promise<U>; cancel: EventEmitter<void> };
}

export interface ITeSortUtilities
{
	// sortFolders(folders: IDictionary<ITaskFolder>): ITaskFolder[];
	sortFolders(folders: ITaskFolder[]): void;
	sortTaskFolder(folder: ITaskFolder, listType: TeTaskListType): void;
	sortTasks(items: (ITaskFile | ITaskItem)[], listType: TeTaskListType): void;
}

export interface ITeTaskUtilities
{
	getGlobPattern(taskType: string): string;
	getScriptTaskTypes(): readonly string[];
	getTaskTypes(): readonly string[];
	getTaskTypeFriendlyName(taskType: string, lowerCase?: boolean): string;
	getTaskTypeRealName(taskType: string): TeTaskSource;
	isExternalType(wrapper: ITeWrapper, source: string): boolean;
	isPinned(id: string, listType: TeTaskListType): boolean;
	isScriptType(source: TeTaskSource): boolean;
	isWatchTask(source: TeTaskSource, wrapper: ITeWrapper): boolean;
	toITask(wrapper: ITeWrapper, teTasks: Task[], listType: TeTaskListType): ITeTask[];
}

export interface ITeTypeUtilities
{
    asArray<T>(v: T | T[] | undefined | null, shallow?: boolean, allowEmpStr?: boolean): T[];
	// asObject<T>(v: T | undefined | null): T;
    asString(v: string | undefined | null, defaultValue?: string): string;
    isArray<T>(v: any, allowEmp?: boolean): v is T[];
	// isAsyncFunction<T = any>(fn: any): fn is () => PromiseLike<T>;
	isBoolean(v: any): v is boolean;
    isDate(v: any): v is Date;
	// isDefined(v: any): boolean;
    isEmpty(v: any, allowEmpStr?: boolean): v is null | undefined | "" | [];
	isNumber(v: any): v is number;
	// isNumeric(v: any): boolean;
    // isObject<T>(v: any, allowArray?: boolean): v is { [key: string]: T } ;
    isObject<T = IDictionary<any>>(v: any, allowArray?: boolean): v is T;
    isObjectEmpty(v: any): boolean;
    isPrimitive(v: any): v is Primitive;
	isPromise<T>(v: any): v is PromiseLike<T>;
	isString(v: any, notEmpty?: boolean): v is string;
	isUri(v: any): v is Uri;
	isWorkspaceFolder(v: any): v is WorkspaceFolder;
}

export type CallbackArray<E, ER> = [ (e: E, ...args: any[]) => ER, ...any[] ];
export type CallbackOptions<E = any, ER = any> = CallbackArray<E, ER> | null | undefined | false;

export interface ITeUtilities
{
	cloneJsonObject<T>(jso: any): T;
	execIf<T, R>(checkValue: T | undefined, ifFn: (arg: T) => R, thisArg?: any, elseOpts?: CallbackOptions): R | undefined;
	execIf<T, R, A1>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
	execIf<T, R, A1, A2>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
	execIf<T, R, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
	execIf<T, R, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
	execIf<T, R, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1>(checkValue: T | undefined, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg?: any, elseOpts?: CallbackOptions, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5): R | undefined;
	/*
	execIf<T, R, A0>(checkValue: T | undefined, ifFn: (arg: T | A0) => R, thisArg?: any, elseOpts?: CallbackOptions | A0 | null): R | undefined;
	execIf<T, R, A0, A1>(checkValue: T | undefined, ifFn: (arg: T | A0, arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions | A0 |null | undefined, arg1: A1): R | undefined;
	execIf<T, R, A0, A1, A2>(checkValue: T | undefined, ifFn: (arg: T | A0, arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions | A0 |null | undefined, arg1: A1, arg2: A2): R | undefined;
	execIf<T, R, A0, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg: T | A0, arg1: A1, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions | A0 |null | undefined, arg1: A1, arg2: A2, arg3: A3): R | undefined;
	execIf<T, R, A0, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg: T | A0, arg1: A1, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions | A0 |null | undefined, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
	execIf<T, R, A0 = T, A1 = any, A2= A1, A3 = A1, A4 = A1, A5 = A1>(checkValue: T | undefined, ifFn: (arg: T | A0, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions | A0 | null | undefined, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
	*/
	/*
	execIf<T, V, R>(checkValue: [ T, V ], ifFn: (arg: V) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
	execIf<T, V, R, A1>(checkValue: [ T, V ], ifFn: (arg: V, arg1: A1) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
	execIf<T, V, R, A1, A2>(checkValue: [ T, V ], ifFn: (arg: V, arg1: A1, arg2: A2) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
	execIf<T, V, R, A1, A2, A3>(checkValue: [ T, V ], ifFn: (arg: V, arg1: A1, arg2: A2, arg3: A3) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
	execIf<T, V, R, A1, A2, A3, A4>(checkValue: [ T, V ], ifFn: (arg: V, arg1: A1, arg2: A2, arg3: A3, arg4: A4) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
	execIf<T, V, R, A1, A2, A3, A4, A5>(checkValue: [ T, V ], ifFn: (arg: V, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
	execIf<T, R>(checkValue: T , ifFn: (arg: T) => R, thisArg?: any, elseOpts?: CallbackOptions | null): R | undefined;
	execIf<T, R, A1>(checkValue: T, ifFn: (arg: T, arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
	execIf<T, R, A1, A2>(checkValue: T, ifFn: (arg: T, arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
	execIf<T, R, A1, A2, A3>(checkValue: T, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
	execIf<T, R, A1, A2, A3, A4>(checkValue: T, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
	execIf<T, R, A1, A2, A3, A4, A5>(checkValue: T, ifFn: (arg: T, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
	*/
	execIf2<T, R, A1>(checkValue: T | undefined, ifFn: (arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
	execIf2<T, R, A1, A2>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
	execIf2<T, R, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
	execIf2<T, R, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
	execIf2<T, R, A1, A2, A3, A4, A5>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
	execIf2<T, R, A1, A2, A3, A4, A5, A6>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6): R | undefined;
	execIf2<T, R, A1, A2, A3, A4, A5, A6, A7>(checkValue: T | undefined, ifFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7): R | undefined;
	execIf2<T, R, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1, A6 = A1, A7 = A1>(checkValue: T | undefined, ifFn: (arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5, arg6?: A6, arg7?: A7) => R, thisArg?: any, elseOpts?: CallbackOptions, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5, arg6?: A6, arg7?: A7): R | undefined;
	formatDate(epochMs: number, format?: "datetime" | "date" | "time"): string;
	getCombinedGlobPattern(defaultPattern: string, globs: string[]): string;
	getDateDifference(date1: Date | number, date2: Date | number, type?: "d" | "h" | "m" | "s"): number;
	getGroupSeparator(): string;
	getPackageManager(): string;
	getRandomNumber(max?: number, min?: number): number;
	lowerCaseFirstChar(s: string, removeSpaces: boolean): string;
	isExcluded(uriPath: string, log: ILog, logPad?: string): boolean;
	isTeEnabled(): boolean;
	openUrl(url: string): void;
	popIfExists(arrOrRec: string[] | Record<string, string> | undefined, ...item: string[]): string[];
	popIfExistsBy<T>(arr: T[] | undefined, fn: (v1: T) => boolean, thisArg?: any, single?: boolean): T[];
	popObjIfExistsBy<T>(rec: Record<string, T> | undefined, fn: (k: string, v: T) => boolean, thisArg?: any, single?: boolean): T[];
	pushIfNotExists(arr: string[] | undefined, ...item: string[]): void;
    // pushIfNotExistsBy<T>(arr: T[] | undefined, fn: (v: T) => boolean, thisArg?: any, ...item: T[]): T[] | undefined;
	removeFromArray(arr: any[], item: any): void;
	sleep(ms: number): Promise<void>;
	testPattern(path: string, pattern: string): boolean;
	textWithElipsis(text: string, maxLength: number): string;
	uniq<T>(a: T[]): T[];
	wrap<R, E, ER>(runFn: () => R, catchFn: CallbackOptions<E, ER>, thisArg?: any): R | E;
	wrap<R, E, ER, A1>(runFn: (arg1: A1) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1): R | E;
	wrap<R, E, ER, A1, A2>(runFn: (arg1: A1, arg2: A2) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2): R | E;
	wrap<R, E, ER, A1, A2, A3>(runFn: (arg1: A1, arg2: A2, arg3: A3) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3): R | E;
	wrap<R, E, ER, A1, A2, A3, A4>(runFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | E;
	wrap<R, E, ER, A1, A2, A3, A4, A5>(runFn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | E;
	wrap<R, E = any, ER = any, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1>(runFn: (arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5) => R, catchFn?: CallbackOptions<E, ER>, thisArg?: any, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5): R | E;
}

/* eslint-disable @typescript-eslint/naming-convention */

import { ILog } from "./ILog";
import { ITeWrapper } from "./ITeWrapper";
import { ITeTask, TeTaskListType, TeTaskSource } from "./ITeTask";
import { Event, EventEmitter, Task, WorkspaceFolder, Uri } from "vscode";


export type Primitive = boolean | number | string;

export type OneOf<T, V extends any[], NK extends keyof V = Exclude<keyof V, keyof any[]>> = { [K in NK]: T extends V[K] ? V[K] : never }[NK];

export type PromiseAdapter<T, U> = (v: T, resolve: (v: U | PromiseLike<U>) => void, reject: (reason: any) => void) => any;

export interface ObjectDiff
{
    previous: Record<string, any>;
    current: Record<string, any>;
}

export enum MarkdownChars
{
    NewLine = "  \n",
    Block = "`",
    Bold = "**",
    Code = "    ",
    Italic = "*",
    BoldItalicStart = "_**",
    BoldItalicEnd = "**_",
    LongDash = "&#8212;",
    Black = "\\u001b[30m",
    Red = "\\u001b[31",
    Green = "\\u001b[32m",
    Yellow = "\\u001b[33m",
    Blue = "\\u001b[34m",
    Magenta = "\\u001b[35",
    Cyan = "\\u001b[36m",
    White = "\\u001b[37m"
}

// export interface ObjectUpdate {
//     oldValue: any;
//     newValue: any;
// }

export interface ITeObjectUtilities
{
    apply<T extends Record<string, any>>(object: Record<string, any>, config: Record<string, any>, defaults?: Record<string, any>): T;
    clone<T>(item: any): T;
    // diff(oldObj: Record<string, any>, newObj: Record<string, any>): ObjectDiff;
    // merge<T extends Record<string, any>>(...destination: Record<string, any>[]): T;
    // mergeIf<T extends Record<string, any>>(...destination: Record<string, any>[]): T;
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
	getTaskAbsoluteUri(task: Task, fileName?: string | boolean, relativePath?: string): Uri;
	getTaskFileName(task: Task): string;
	getTaskRelativePath(task: Task): string;
	getUserDataPath(test?: boolean, platform?: string): string;
}

export interface ITePromiseUtilities
{
	oneTimeEvent<T>(event: Event<T>): Event<T>;
	promiseFromEvent<T, U>(event: Event<T>, adapter?: PromiseAdapter<T, U>): { promise: Promise<U>; cancel: EventEmitter<void> };
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
	isScriptType(source: string): boolean;
	// isSupportedType(source: string): boolean;
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
    isObject<T = Record<string, any>>(v: any, allowArray?: boolean): v is T;
    isObjectEmpty(v: any): boolean;
    isPrimitive(v: any): v is Primitive;
	isPromise<T>(v: any): v is PromiseLike<T>;
	isString(v: any, notEmpty?: boolean): v is string;
	isUri(v: any): v is Uri;
	isWorkspaceFolder(v: any): v is WorkspaceFolder;
}

export type CallbackArray<E, ER> = [ (e: E, ...args: any[]) => ER, ...any[] ];
export type CallbackOptions<E = any, ER = any> = CallbackArray<E, ER> | null | undefined | false;
export type ErrorType<T extends new (...args: any) => any> = T extends new (...args: any) => infer R ? R : any;
// type WrapArgs<T extends (...args: any) => any> = (...args: Parameters<T>) => Parameters<T>;

export interface ITeUtilities
{
	awaitMaybe<R>(promise: R | PromiseLike<R>): Promise<R>;
	cloneJsonObject<T>(jso: any): T;
	emptyFn(): void;
	execIf<T, R>(checkValue: T | undefined, ifFn: (arg: NonNullable<T>) => R, thisArg?: any, elseOpts?: CallbackOptions): R | undefined;
	execIf<T, R, A1>(checkValue: T | undefined, ifFn: (arg: NonNullable<T>, arg1: A1) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
	execIf<T, R, A1, A2>(checkValue: T | undefined, ifFn: (arg: NonNullable<T>, arg1: A1, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
	execIf<T, R, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg: NonNullable<T>, arg1: A1, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
	execIf<T, R, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg: NonNullable<T>, arg1: A1, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
	execIf<T, R, A1, A2, A3, A4, A5>(checkValue: T | undefined, ifFn: (arg: NonNullable<T>, arg1: A1, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
	execIf<T, R, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1>(checkValue: T | undefined, ifFn: (arg: NonNullable<T>, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg?: any, elseOpts?: CallbackOptions, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5): R | undefined;
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
	execIf2<T, R, A1>(checkValue: T | undefined, ifFn: (arg1: NonNullable<A1>) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1): R | undefined;
	execIf2<T, R, A1, A2>(checkValue: T | undefined, ifFn: (arg1: NonNullable<A1>, arg2: A2) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2): R | undefined;
	execIf2<T, R, A1, A2, A3>(checkValue: T | undefined, ifFn: (arg1: NonNullable<A1>, arg2: A2, arg3: A3) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3): R | undefined;
	execIf2<T, R, A1, A2, A3, A4>(checkValue: T | undefined, ifFn: (arg1: NonNullable<A1>, arg2: A2, arg3: A3, arg4: A4) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R | undefined;
	execIf2<T, R, A1, A2, A3, A4, A5>(checkValue: T | undefined, ifFn: (arg1: NonNullable<A1>, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R | undefined;
	execIf2<T, R, A1, A2, A3, A4, A5, A6>(checkValue: T | undefined, ifFn: (arg1: NonNullable<A1>, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6): R | undefined;
	execIf2<T, R, A1, A2, A3, A4, A5, A6, A7>(checkValue: T | undefined, ifFn: (arg1: NonNullable<A1>, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7) => R, thisArg: any, elseOpts: CallbackOptions, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7): R | undefined;
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
	promptRestart(message: string, callback?: (...args: any[]) => void | PromiseLike<void>, thisArg?: any, ...args: any[]): Promise<boolean>;
	properCase(name: string | undefined, removeSpaces?: boolean): string;
	pushIfNotExists(arr: string[] | undefined, ...item: string[]): void;
    // pushIfNotExistsBy<T>(arr: T[] | undefined, fn: (v: T) => boolean, thisArg?: any, ...item: T[]): T[] | undefined;
	removeFromArray(arr: any[], item: any): void;
	sleep(ms: number): Promise<void>;
	testPattern(path: string, pattern: string): boolean;
	textWithElipsis(text: string, maxLength: number): string;
	throwIf<T extends typeof Error>(checkValue: any, errorType: T, ...args: any[]): void | never;
	uniq<T>(a: T[]): T[];
	// wrap2<R, E, ER, A>(runFn: (...args: WrapArgs<A>[]) => R, catchFn?: CallbackOptions<E, ER>, thisArg?: any, ...args: WrapArgs<A>[]): R;
	wrap<R, E, ER>(runFn: () => R, catchFn?: CallbackOptions<E, ER>, thisArg?: any): R;
	wrap<R, E, ER, A1>(runFn: (arg1: NonNullable<A1>) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1): R;
	wrap<R, E, ER, A1, A2>(runFn: (arg1: NonNullable<A1>, arg2: NonNullable<A2>) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2): R;
	wrap<R, E, ER, A1, A2, A3>(runFn: (arg1: NonNullable<A1>, arg2: NonNullable<A2>, arg3: NonNullable<A3>) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3): R;
	wrap<R, E, ER, A1, A2, A3, A4>(runFn: (arg1: NonNullable<A1>, arg2: NonNullable<A2>, arg3: NonNullable<A3>, arg4: NonNullable<A4>) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4): R;
	wrap<R, E, ER, A1, A2, A3, A4, A5>(runFn: (arg1: NonNullable<A1>, arg2: NonNullable<A2>, arg3: NonNullable<A3>, arg4: NonNullable<A4>, arg5: NonNullable<A5>) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5): R;
	wrap<R, E, ER, A1, A2, A3, A4, A5, A6>(runFn: (arg1: NonNullable<A1>, arg2: NonNullable<A2>, arg3: NonNullable<A3>, arg4: NonNullable<A4>, arg5: NonNullable<A5>, arg6: NonNullable<A6>) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6): R;
	wrap<R, E, ER, A1, A2, A3, A4, A5, A6, A7>(runFn: (arg1: NonNullable<A1>, arg2: NonNullable<A2>, arg3: NonNullable<A3>, arg4: NonNullable<A4>, arg5: NonNullable<A5>, arg6: NonNullable<A6>, arg7: NonNullable<A7>) => R, catchFn: CallbackOptions<E, ER>, thisArg: any, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7): R;
	wrap<R, E = any, ER = any, A1 = any, A2 = A1, A3 = A1, A4 = A1, A5 = A1, A6 = A1, A7 = A1>(runFn: (arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5, arg6?: A6, arg7?: A7) => R, catchFn?: CallbackOptions<E, ER>, thisArg?: any, arg1?: A1, arg2?: A2, arg3?: A3, arg4?: A4, arg5?: A5, arg6?: A6, arg7?: A7): R;
}


import { ITaskFile } from "./ITaskFile";
import { ITaskItem } from "./ITaskItem";
import { ITeWrapper } from "./ITeWrapper";
import { ITaskFolder } from "./ITaskFolder";
import { IDictionary } from "./IDictionary";
import { ITeTask, TeTaskListType } from "./ITeTask";
import { Event, EventEmitter, Task, WorkspaceFolder, Uri } from "vscode";


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

export interface ITePathUtilities
{
	getCwd(uri: Uri): string;
	getInstallPath(): Promise<string>;
	getPortableDataPath(logPad?: string): string | undefined;
	getRelativePath(folder: WorkspaceFolder, uri: Uri): string;
	getTaskRelativePath(task: Task): string;
	getUserDataPath(platform?: string, logPad?: string): string;
}

export interface ITePromiseUtilities
{
	oneTimeEvent<T>(event: Event<T>): Event<T>;
	promiseFromEvent<T, U>(event: Event<T>, adapter?: PromiseAdapter<T, U>): { promise: Promise<U>; cancel: EventEmitter<void> };
}

export interface ITeSortUtilities
{
	sortFolders(folders: IDictionary<ITaskFolder>): ITaskFolder[];
	sortTaskFolder(folder: ITaskFolder, listType: TeTaskListType): void;
	sortTasks(items: (ITaskFile | ITaskItem)[] | undefined, listType: TeTaskListType): void;
}

export interface ITeTaskUtilities
{
	getGlobPattern(taskType: string): string;
	getScriptTaskTypes(): string[];
	getTaskTypes(): string[];
	getTaskTypeFriendlyName(taskType: string, lowerCase?: boolean): string;
	getTaskTypeRealName(taskType: string): string;
	isPinned(id: string, listType: TeTaskListType): boolean;
	isScriptType(source: string): boolean;
	isWatchTask(source: string, wrapper: ITeWrapper): boolean;
	toITask(wrapper: ITeWrapper, teTasks: Task[], listType: TeTaskListType): ITeTask[];
}

export interface ITeTypeUtilities
{
	isArray<T>(v: any): v is T[];
	isBoolean(v: any): v is boolean;
	// isDefined(v: any): boolean;
	isNumber(v: any): v is number;
	isObject(v: any): v is { [key: string]: any };
	isObjectEmpty(v: any): boolean;
	isString(v: any, notEmpty?: boolean): v is string;
	isUri(v: any): v is Uri;
	isWorkspaceFolder(v: any): v is WorkspaceFolder;
}

export interface ITeUtilities
{
	cloneJsonObject<T>(jso: any): T;
	execIf<T, R = any>(checkValue: T | undefined, runFn: (arg: T, ...args: unknown[]) => R | PromiseLike<R>, thisArg?: any, ...args: unknown[]): R | PromiseLike<R> | undefined | void;
	execIfElse<T, R = any, ER = R>(checkValue: T | undefined, runIfFn: (arg: T, ...args: unknown[]) => R | PromiseLike<R>, runElseFn: (...args: unknown[]) => ER | PromiseLike<ER>, thisArg?: any, ...args: unknown[]): R | PromiseLike<R> | ER | PromiseLike<ER> | undefined | void;
	formatDate(epochMs: number, format?: "datetime" | "date" | "time"): string;
	getCombinedGlobPattern(defaultPattern: string, globs: string[]): string;
	getDateDifference(date1: Date | number, date2: Date | number, type?: "d" | "h" | "m" | "s"): number;
	getGroupSeparator(): string;
	getPackageManager(): string;
	getRandomNumber(max?: number, min?: number): number;
	lowerCaseFirstChar(s: string, removeSpaces: boolean): string;
	isExcluded(uriPath: string, logPad?: string): boolean;
	isTaskTypeEnabled(taskType: string): boolean;
	isTeEnabled(): boolean;
	openUrl(url: string): void;
	pushIfNotExists(arr: any[], item: any): void;
	removeFromArray(arr: any[], item: any): void;
	sleep(ms: number): Promise<void>;
	testPattern(path: string, pattern: string): boolean;
	textWithElipsis(text: string, maxLength: number): string;
}

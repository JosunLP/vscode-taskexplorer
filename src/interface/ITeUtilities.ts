
import { ITaskFile } from "./ITaskFile";
import { ITaskItem } from "./ITaskItem";
import { ITeWrapper } from "./ITeWrapper";
import { ITaskFolder } from "./ITaskFolder";
import { IDictionary } from "./IDictionary";
import { ITeTask, TeTaskListType } from "./ITeTask";
import { Event, EventEmitter, Task, WorkspaceFolder, Uri } from "vscode";


export type PromiseAdapter<T, U> = (
    value: T,
    resolve:
        (value: U | PromiseLike<U>) => void,
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
	getUserDataPath(platform?: string, logPad?: string): string;
}

export interface ITePromiseUtilities
{
	oneTimeEvent<T>(event: Event<T>): Event<T>;
	promiseFromEvent<T, U>(event: Event<T>, adapter: PromiseAdapter<T, U>): { promise: Promise<U>; cancel: EventEmitter<void> };
}

export interface ITeSortUtilities
{
	sortFolders(folders: IDictionary<ITaskFolder>): ITaskFolder[];
	sortTaskFolder(folder: ITaskFolder, listType?: TeTaskListType): void;
	sortTasks(items: (ITaskFile | ITaskItem)[] | undefined, listType?: TeTaskListType): void;
}

export interface ITeTaskUtilities
{
	getScriptTaskTypes(): string[];
	getTaskTypes(): string[];
	getTaskTypeFriendlyName(taskType: string, lowerCase?: boolean): string;
	getTaskTypeRealName(taskType: string): string;
	isScriptType(source: string): boolean;
	isWatchTask(source: string): boolean;
	toITask(wrapper: ITeWrapper, teTasks: Task[], listType: TeTaskListType): ITeTask[];
}

export interface ITeUtilities
{
	getCombinedGlobPattern(defaultPattern: string, globs: string[]): string;
	getDateDifference(date1: Date | number, date2: Date | number, type?: "d" | "h" | "m" | "s"): number;
	getGlobPattern(taskType: string): string;
	getGroupSeparator(): string;
	getPackageManager(): string;
	lowerCaseFirstChar(s: string, removeSpaces: boolean): string;
	isArray<T>(value: any): value is T[];
	isBoolean(value: any): value is boolean;
	isNumber(n: any): n is number;
	isExcluded(uriPath: string, logPad?: string): boolean;
	isObject(value: any): value is { [key: string]: any };
	isObjectEmpty(value: any): boolean;
	isString(value: any, notEmpty?: boolean): value is string;
	isTaskTypeEnabled(taskType: string): boolean;
	isUri(u: any): u is Uri;
	isWorkspaceFolder(value: any): value is WorkspaceFolder;
	openUrl(url: string): void;
	pushIfNotExists(arr: any[], item: any): void;
	removeFromArray(arr: any[], item: any): void;
	showMaxTasksReachedMessage(licMgr: any, taskType?: string, force?: boolean): void;
	testPattern(path: string, pattern: string): boolean;
	textWithElipsis(text: string, maxLength: number): string;
	timeout(ms: number): Promise<void>;
}

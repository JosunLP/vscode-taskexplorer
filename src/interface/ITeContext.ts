/* eslint-disable @typescript-eslint/naming-convention */

import {  TreeviewIds, WebviewIds, WebviewViewIds } from "./ITeWebview";

export type WebviewContextKey = `${ContextKeys.WebviewPrefix}${WebviewIds}${string}`;
export type WebviewViewContextKey = `${ContextKeys.WebviewViewPrefix}${WebviewViewIds}${string}`;
export type TreeviewContextKey = `${ContextKeys.TreeviewPrefix}${TreeviewIds}${string}`;

export type AllContextKeys = ContextKeys | TreeviewContextKey | WebviewContextKey | WebviewViewContextKey
						   | `${ContextKeys.AccountPrefix}${string}`
						   | `${ContextKeys.KeyPrefix}${string}`
						   | `${ContextKeys.FileCachePrefix}${string}`
						   | `${ContextKeys.TasksPrefix}${string}`;

export enum ContextKeys
{
	AccountPrefix = "taskexplorer:account:",
	FileCachePrefix = "taskexplorer:fileCache:",
	KeyPrefix = "taskexplorer:key:",
	TasksPrefix = "taskexplorer:tasks:",
	TreeviewPrefix = "taskexplorer:treeView:",
	TreeViewExplorerPrefix = "taskexplorer:treeView:taskTreeExplorer",
	TreeViewSideBarPrefix = "taskexplorer:treeView:tasktreeSideBar",
	WebviewPrefix = "taskexplorer:webview:",
	WebviewViewPrefix = "taskexplorer:webviewView:",
	Dev = "taskexplorer:dev",
	Disabled = "taskexplorer:disabled",
	Enabled = "taskexplorer:enabled",
	Untrusted = "taskexplorer:untrusted",
	LicensePage = "taskexplorer:licensePage",
	LicensingActive = "taskexplorer:licensingActive",
	TaskMonitor  = "taskexplorer:taskMonitor",
	ParsingReport = "taskexplorer:parsingReport",
	ReleaseNotes = "taskexplorer:releaseNotes",
	Tests = "taskexplorer:tests",
	TestsTest = "taskexplorer:testsTest"
}

export interface ITeContext
{
	getContext<T>(key: string): T | undefined;
    getContext<T>(key: string, defaultValue?: T): T;
	setContext(key: string, value: unknown): Promise<void>;
}

export interface IContextChangeEvent
{
	key: AllContextKeys;
	value: any;
}

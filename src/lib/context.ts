/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/naming-convention */

import { VsCodeCommands } from "./command/command";
import { ITeContext, IDictionary } from "../interface";
import { commands, Event, EventEmitter } from "vscode";

export type TreeViewIds = "taskTreeExplorer" | "taskTreeSideBar";
export type WebviewIds = "parsingReport" | "licensePage" | "releaseNotes" | "taskDetails" | "taskMonitor" | "welcome";
export type WebviewViewIds = "home" | "taskCount" | "taskUsage";

export const enum ContextKeys
{
	ActionPrefix = "taskexplorer:action:",
	FileCachePrefix = "taskexplorer:fileCache:",
	KeyPrefix = "taskexplorer:key:",
	TreeViewPrefix = "taskexplorer:treeView:",
	TreeViewExplorerPrefix = "taskexplorer:treeView:taskTreeExplorer",
	TreeViewSideBarPrefix = "taskexplorer:treeView:tasktreeSideBar",
	WebviewPrefix = "taskexplorer:webview:",
	WebviewViewPrefix = "taskexplorer:webviewView:",
	Debugging = "taskexplorer:debugging",
	Disabled = "taskexplorer:disabled",
	Enabled = "taskexplorer:enabled",
	Untrusted = "taskexplorer:untrusted",
	LicensePage = "taskexplorer:licensePage",
	TaskMonitor  = "taskexplorer:taskMonitor",
	ParsingReport = "taskexplorer:parsingReport",
	ReleaseNotes = "taskexplorer:releaseNotes",
	Tests = "taskexplorer:tests",
	TestsTest = "taskexplorer:testsTest"
}

type FileCacheContextKeys =
	`${ContextKeys.FileCachePrefix}:taskFiles`
	| `${ContextKeys.FileCachePrefix}:taskTypes`;

type TreeviewContextKeys =
	`${ContextKeys.TreeViewPrefix}${TreeViewIds}:active`;

type WebviewPageContextKeys =
	`${ContextKeys.WebviewPrefix}${WebviewIds}:active`
	| `${ContextKeys.WebviewPrefix}${WebviewIds}:focus`
	| `${ContextKeys.WebviewPrefix}${WebviewIds}:inputFocus`;

type WebviewViewContextKeys =
	`${ContextKeys.WebviewViewPrefix}${WebviewViewIds}:focus`
	| `${ContextKeys.WebviewViewPrefix}${WebviewViewIds}:inputFocus`;

type AllContextKeys =
	ContextKeys | TreeviewContextKeys | WebviewPageContextKeys | WebviewViewContextKeys
	| `${ContextKeys.ActionPrefix}${string}` | FileCacheContextKeys
	| `${ContextKeys.KeyPrefix}${string}`
	| `${ContextKeys.FileCachePrefix}${string}`;


export class TeContext implements ITeContext
{
	private contextStorage: IDictionary<unknown> = {};
	private _onDidChangeContext = new EventEmitter<AllContextKeys>();
	public onDidChangeContext: Event<AllContextKeys>;

	constructor()
	{
		this.onDidChangeContext = this._onDidChangeContext.event;
	}

	getContext = <T>(key: AllContextKeys, defaultValue?: T) => this.contextStorage[key] as T | undefined || defaultValue;

	setContext = async(key: AllContextKeys, value: unknown): Promise<void> =>
	{
		this.contextStorage[key] = value;
		void (await commands.executeCommand(VsCodeCommands.SetContext, key, value));
		this._onDidChangeContext.fire(key);
	};

}

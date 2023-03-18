/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/naming-convention */

import { VsCodeCommands } from "./command/command";
import { ITeContext, IDictionary } from "../interface";
import { commands, Disposable, Event, EventEmitter } from "vscode";

export type TreeViewIds = "taskTreeExplorer" | "taskTreeSideBar";
export type WebviewIds = "parsingReport" | "licensePage" | "releaseNotes" | "taskDetails" | "taskMonitor" | "welcome";
export type WebviewViewIds = "home" | "taskCount" | "taskUsage";

export const enum ContextKeys
{
	FileCachePrefix = "taskexplorer:fileCache:",
	KeyPrefix = "taskexplorer:key:",
	TasksPrefix = "taskexplorer:tasks:",
	TreeViewPrefix = "taskexplorer:treeView:",
	TreeViewExplorerPrefix = "taskexplorer:treeView:taskTreeExplorer",
	TreeViewSideBarPrefix = "taskexplorer:treeView:tasktreeSideBar",
	WebviewPrefix = "taskexplorer:webview:",
	WebviewViewPrefix = "taskexplorer:webviewView:",
	Dev = "taskexplorer:dev",
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

type AllContextKeys =
	ContextKeys
	| `${ContextKeys.KeyPrefix}${string}`
	| `${ContextKeys.FileCachePrefix}${string}`
	| `${ContextKeys.TasksPrefix}${string}`
	| `${ContextKeys.TreeViewPrefix}${TreeViewIds}${string}`
	| `${ContextKeys.WebviewPrefix}${WebviewIds}${string}`
	| `${ContextKeys.WebviewViewPrefix}${WebviewViewIds}${string}`;


export class TeContext implements ITeContext, Disposable
{
	private _disposables: Disposable[] = [];
	private contextStorage: IDictionary<unknown> = {};
	private _onDidChangeContext: EventEmitter<AllContextKeys>;


	constructor()
	{
		this._onDidChangeContext = new EventEmitter<AllContextKeys>();
		this._disposables.push(this._onDidChangeContext);
	}


    dispose = () => this._disposables.forEach(d => d.dispose());


	get onDidChangeContext() {
		return this._onDidChangeContext.event;
	}


	getContext = <T>(key: AllContextKeys, defaultValue?: T) =>
		this.contextStorage[key] as T | undefined || (!defaultValue && this.contextStorage[key] === false ? false as unknown as T : defaultValue);


	setContext = async(key: AllContextKeys, value: unknown): Promise<void> =>
	{
		this.contextStorage[key] = value;
		void (await commands.executeCommand(VsCodeCommands.SetContext, key, value));
		this._onDidChangeContext.fire(key);
	};

}

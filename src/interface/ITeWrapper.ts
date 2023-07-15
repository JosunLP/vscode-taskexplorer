/* eslint-disable @typescript-eslint/naming-convention */

import { ILog, ILogControl } from "./ILog";
import { ITeWebview } from "./ITeWebview";
import { ITeFigures } from "./ITeFigures";
import { IEventQueue } from "./IEventQueue";
import { ITeStatusBar } from "./ITeStatusBar";
import { ITeFileCache } from "./ITeFileCache";
import { ITeFilesystem } from "./ITeFilesystem";
import { ITeUsage, UsageKeys } from "./ITeUsage";
import { IStorage, StorageKeys } from "./IStorage";
import { ITeTreeManager } from "./ITeTreeManager";
import { ITeTaskManager } from "./ITeTaskManager";
import { ITeFileWatcher } from "./ITeFileWatcher";
import { Commands, VsCodeCommands } from "./ICommand";
import { ITaskExplorerApi } from "./ITaskExplorerApi";
import { ContextKeys, ITeContext } from "./ITeContext";
import { ITeLicenseManager } from "./ITeLicenseManager";
import { ITaskTreeView, ITeTaskTree } from "./ITeTaskTree";
import { ConfigKeys, IConfiguration } from "./IConfiguration";
import { ExtensionContext, Event, TreeItem, TreeView, WorkspaceFolder } from "vscode";
import {
	ITeCommonUtilities, ITeObjectUtilities, ITePathUtilities, ITePromiseUtilities, ITeTaskUtilities, ITeTypeUtilities, ITeUtilities
} from "./ITeUtilities";
import { ITaskExplorerProvider } from "./ITaskProvider";

export type TeRuntimeEnvironment = "dev" | "tests" | "production";

export interface ITeKeys
{
	Commands: typeof Commands;
	Config: typeof ConfigKeys;
	Context: typeof ContextKeys;
	Globs: Record<string, string>;
	Numbers: Record<string, number>;
	Regex: Record<string, RegExp>;
	Strings: Record<string, string>;
	Storage: typeof StorageKeys;
	Usage: typeof UsageKeys;
	VsCodeCommands: typeof VsCodeCommands;
}

export interface ITeWrapper
{
	init(): Promise<void>;
	localize(key: string, defaultMessage: string): string;
	waitReady(ignoreModule?: any[], minWait?: number, maxWait?: number): Promise<void>;

	readonly dev: boolean;
	readonly production: boolean;
	readonly tests: boolean;
	readonly isReady: boolean;
    readonly onReady: Event<void>;
	readonly env: TeRuntimeEnvironment;
	readonly busy: boolean;
	readonly busyWebviews: boolean;

	readonly api: ITaskExplorerApi;
	readonly commonUtils: ITeCommonUtilities;
	readonly config: IConfiguration;
	readonly context: ExtensionContext;
	readonly contextTe: ITeContext;
	readonly eventQueue: IEventQueue;
	readonly explorer: ITeTaskTree;
	readonly explorerView: TreeView<TreeItem>;
	readonly extensionAuthor: string;
	readonly extensionId: string;
	readonly extensionName: string;
	readonly extensionTitle: string;
	readonly extensionTitleShort: string;
	readonly fileWatcher: ITeFileWatcher;
	readonly figures: ITeFigures;
	readonly homeView: ITeWebview;
	readonly fileCache: ITeFileCache;
	readonly fs: ITeFilesystem;
	readonly keys: ITeKeys;
	readonly licenseManager: ITeLicenseManager;
	readonly licensePage: ITeWebview;
	readonly log: ILog;
	readonly logControl: ILogControl;
	readonly objUtils: ITeObjectUtilities;
	readonly parsingReportPage: ITeWebview;
	readonly pathUtils: ITePathUtilities;
	readonly promiseUtils: ITePromiseUtilities;
	readonly providers: Record<string, ITaskExplorerProvider>;
	readonly releaseNotesPage: ITeWebview;
	readonly sidebar: ITeTaskTree;
	readonly sidebarView: TreeView<TreeItem>;
	readonly statusBar: ITeStatusBar;
	readonly storage: IStorage;
	readonly treeManager: ITeTreeManager;
	readonly taskManager: ITeTaskManager;
	readonly taskMonitorPage: ITeWebview;
	readonly taskUsageView: ITeWebview;
	readonly taskCountView: ITeWebview;
	readonly taskUtils: ITeTaskUtilities;
	readonly typeUtils: ITeTypeUtilities;
	readonly usage: ITeUsage;
	readonly utils: ITeUtilities;
	readonly views: { [id in "taskExplorer" | "taskExplorerSideBar"]: ITaskTreeView };
	readonly welcomePage: ITeWebview;
	readonly wsfolder: WorkspaceFolder;
}

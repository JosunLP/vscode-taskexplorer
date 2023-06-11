/* eslint-disable @typescript-eslint/naming-convention */

import { ILog } from "./ILog";
import { ITeUsage, UsageKeys } from "./ITeUsage";
import { IStorage, StorageKeys } from "./IStorage";
import { ContextKeys, ITeContext } from "./ITeContext";
import { ITeWebview } from "./ITeWebview";
import { ITeFigures } from "./ITeFigures";
import { IDictionary } from "./IDictionary";
import { ITeStatusBar } from "./ITeStatusBar";
import { ITeFileCache } from "./ITeFileCache";
import { ITeFilesystem } from "./ITeFilesystem";
import { ITeTreeManager } from "./ITeTreeManager";
import { ITeTaskManager } from "./ITeTaskManager";
import { ITeFileWatcher } from "./ITeFileWatcher";
import { Commands, VsCodeCommands } from "./ICommand";
import { ITaskExplorerApi } from "./ITaskExplorerApi";
import { ITeLicenseManager } from "./ITeLicenseManager";
import { ITaskTreeView, ITeTaskTree } from "./ITeTaskTree";
import { ConfigKeys, IConfiguration } from "./IConfiguration";
import { ExtensionContext, Event, TreeItem, TreeView, WorkspaceFolder } from "vscode";
import {
	ITeCommonUtilities, ITePathUtilities, ITePromiseUtilities, ITeSortUtilities, ITeTaskUtilities, ITeTypeUtilities, ITeUtilities
} from "./ITeUtilities";

export type TeRuntimeEnvironment = "dev" | "tests" | "production";

export interface ITeKeys
{
	Commands: typeof Commands;
	Config: typeof ConfigKeys;
	Context: typeof ContextKeys;
	Globs: any;
	Strings: any;
	Storage: typeof StorageKeys;
	Usage: typeof UsageKeys;
	VsCodeCommands: typeof VsCodeCommands;
}

export interface ITeWrapper
{
	init(): Promise<void>;
	localize(key: string, defaultMessage: string): string;

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
	readonly logControl: IDictionary<any>;
	readonly parsingReportPage: ITeWebview;
	readonly pathUtils: ITePathUtilities;
	readonly promiseUtils: ITePromiseUtilities;
	readonly releaseNotesPage: ITeWebview;
	readonly server: any;
	readonly sidebar: ITeTaskTree;
	readonly sidebarView: TreeView<TreeItem>;
	readonly sorters: ITeSortUtilities;
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

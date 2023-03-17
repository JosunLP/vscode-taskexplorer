/* eslint-disable @typescript-eslint/naming-convention */

import { ILog } from "./ILog";
import { ITeUsage } from "./ITeUsage";
import { IStorage } from "./IStorage";
import { ITeContext } from "./ITeContext";
import { ITeWebview } from "./ITeWebview";
import { ITeFigures } from "./ITeFigures";
import { IDictionary } from "./IDictionary";
import { ITeFileCache } from "./ITeFileCache";
import { ITeFilesystem } from "./ITeFilesystem";
import { ITeTreeManager } from "./ITeTreeManager";
import { ITeTaskManager } from "./ITeTaskManager";
import { IConfiguration } from "./IConfiguration";
import { ITeFileWatcher } from "./ITeFileWatcher";
import { ITaskExplorerApi } from "./ITaskExplorerApi";
import { ITeConfigWatcher } from "./ITeConfigWatcher";
import { ITeLicenseManager } from "./ITeLicenseManager";
import { ITaskTreeView, ITeTaskTree } from "./ITeTaskTree";
import { ExtensionContext, TreeItem, TreeView, WorkspaceFolder } from "vscode";
import {
	ITeCommonUtilities, ITePathUtilities, ITePromiseUtilities, ITeSortUtilities, ITeTaskUtilities, ITeTypeUtilities, ITeUtilities
} from "./ITeUtilities";
import { ITeStatusBar } from "./ITeStatusBar";

export type TeRuntimeEnvironment = "dev" | "tests" | "production";

interface ITeKeys
{
	Storage: any;
	Config: any;
	Strings: any;
	Globs: any;
}

export interface ITeWrapper
{
	init(): Promise<void>;

	dev: boolean;
	production: boolean;
	tests: boolean;
	readonly env: TeRuntimeEnvironment;
	readonly busy: boolean;
	readonly busyWebviews: boolean;

	api: ITaskExplorerApi;
	commonUtils: ITeCommonUtilities;
	config: IConfiguration;
	context: ExtensionContext;
	contextTe: ITeContext;
	configWatcher: ITeConfigWatcher;
	explorer: ITeTaskTree;
	explorerView: TreeView<TreeItem>;
	fileWatcher: ITeFileWatcher;
	figures: ITeFigures;
	homeView: ITeWebview;
	filecache: ITeFileCache;
	fs: ITeFilesystem;
	keys: ITeKeys;
	licenseManager: ITeLicenseManager;
	licensePage: ITeWebview;
	log: ILog;
	logControl: IDictionary<any>;
	parsingReportPage: ITeWebview;
	pathUtils: ITePathUtilities;
	promiseUtils: ITePromiseUtilities;
	releaseNotesPage: ITeWebview;
	server: any;
	sidebar: ITeTaskTree;
	sidebarView: TreeView<TreeItem>;
	sorters: ITeSortUtilities;
	statusBar: ITeStatusBar;
	storage: IStorage;
	treeManager: ITeTreeManager;
	taskManager: ITeTaskManager;
	taskMonitorPage: ITeWebview;
	taskUsageView: ITeWebview;
	taskCountView: ITeWebview;
	taskUtils: ITeTaskUtilities;
	typeUtils: ITeTypeUtilities;
	usage: ITeUsage;
	utils: ITeUtilities;
	views: { [id in "taskExplorer" | "taskExplorerSideBar"]: ITaskTreeView };
	welcomePage: ITeWebview;
	wsfolder: WorkspaceFolder;
}


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


export interface ITeWrapper
{
	init(): Promise<void>;

	tests: boolean;
	readonly debugging: boolean;
	readonly env: "dev" | "tests" | "production";
	readonly id: string;
	readonly busy: boolean;

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
	licenseManager: ITeLicenseManager;
	licensePage: ITeWebview;
	log: ILog;
	logControl: IDictionary<any>;
	parsingReportPage: ITeWebview;
	pathUtils: ITePathUtilities;
	promiseUtils: ITePromiseUtilities;
	releaseNotesPage: ITeWebview;
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
	views: IDictionary<ITaskTreeView>;
	welcomePage: ITeWebview;
	wsfolder: WorkspaceFolder;
}

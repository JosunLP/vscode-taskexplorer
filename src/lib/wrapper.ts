
import { TeApi } from "./api";
import { Usage } from "./usage";
import * as fs from "./utils/fs";
import { TeServer } from "./server";
import { getUuid } from "@env/crypto";
import { logControl } from "./log/log";
import { TaskTree } from "../tree/tree";
import { figures } from "./utils/figures";
import { TeFileCache } from "./fileCache";
import * as utilities from "./utils/utils";
import * as sorters from "./utils/sortTasks";
import { TeStatusBar } from "./statusBarItem";
import * as pathUtils from "./utils/pathUtils";
import * as taskUtils from "./utils/taskUtils";
import { IStorage } from "../interface/IStorage";
import { TaskManager } from "../tree/taskManager";
import { TaskWatcher } from "../tree/taskWatcher";
import { LicenseManager } from "./licenseManager";
import * as commonUtils from "./utils/commonUtils";
import { ConfigKeys, StorageKeys, Strings } from "./constants";
import { ContextKeys, TeContext } from "./context";
import { AntTaskProvider } from "../providers/ant";
import { HomeView } from "../webview/view/homeView";
import * as promiseUtils from "./utils/promiseUtils";
import { BashTaskProvider } from "../providers/bash";
import { GulpTaskProvider } from "../providers/gulp";
import { MakeTaskProvider } from "../providers/make";
import { RubyTaskProvider } from "../providers/ruby";
import { NsisTaskProvider } from "../providers/nsis";
import { PerlTaskProvider } from "../providers/perl";
import { ITeWrapper } from "../interface/ITeWrapper";
import { WelcomePage } from "../webview/page/welcome";
import { TeFileWatcher } from "./watcher/fileWatcher";
import { TaskTreeManager } from "../tree/treeManager";
import { BatchTaskProvider } from "../providers/batch";
import { MavenTaskProvider } from "../providers/maven";
import { GruntTaskProvider } from "../providers/grunt";
import { GradleTaskProvider } from "../providers/gradle";
import { PipenvTaskProvider } from "../providers/pipenv";
import { PythonTaskProvider } from "../providers/python";
import { TeConfigWatcher } from "./watcher/configWatcher";
import { LicensePage } from "../webview/page/licensePage";
import { MonitorPage } from "../webview/page/monitorPage";
import { WebpackTaskProvider } from "../providers/webpack";
import { JenkinsTaskProvider } from "../providers/jenkins";
import { ComposerTaskProvider } from "../providers/composer";
import { TaskExplorerProvider } from "../providers/provider";
import { IConfiguration } from "../interface/IConfiguration";
import { TaskCountView } from "../webview/view/taskCountView";
import { TaskUsageView } from "../webview/view/taskUsageView";
import { TaskDetailsPage } from "../webview/page/taskDetails";
import { Commands, registerCommand } from "./command/command";
import { ReleaseNotesPage } from "../webview/page/releaseNotes";
import { PowershellTaskProvider } from "../providers/powershell";
import { ITaskExplorerProvider } from "../interface/ITaskProvider";
import { AppPublisherTaskProvider } from "../providers/appPublisher";
import { ParsingReportPage } from "../webview/page/parsingReportPage";
import { registerAddToExcludesCommand } from "./command/addToExcludes";
import { registerEnableTaskTypeCommand } from "./command/enableTaskType";
import { registerDisableTaskTypeCommand } from "./command/disableTaskType";
import { registerRemoveFromExcludesCommand } from "./command/removeFromExcludes";
import {
	ExtensionContext, ExtensionMode, tasks, workspace, WorkspaceFolder, env, TreeItem,
	TreeView, Disposable, EventEmitter
} from "vscode";
import {
	IDictionary, ILog, ITeFilesystem, ITePathUtilities, ITePromiseUtilities, ITeSortUtilities,
	ITeTaskUtilities, ITeUtilities
} from "../interface";

export class TeWrapper implements ITeWrapper, Disposable
{

	private _ready = false;
	private _tests = false;
	private _busy = false;
	private _initialized = false;
	private _cacheBuster: string;

	private readonly _log: ILog;
	private readonly _usage: Usage;
	private readonly _teApi: TeApi;
	private readonly _version: string;
	private readonly _server: TeServer;
	private readonly _storage: IStorage;
	private readonly _homeView: HomeView;
	private readonly _teContext: TeContext;
	private readonly _fileCache: TeFileCache;
	private readonly _statusBar: TeStatusBar;
    private readonly _taskWatcher: TaskWatcher;
	private readonly _licensePage: LicensePage;
	private readonly _welcomePage: WelcomePage;
    private readonly _taskManager: TaskManager;
	private readonly _disposables: Disposable[];
	private readonly _context: ExtensionContext;
	private readonly _fileWatcher: TeFileWatcher;
	private readonly _treeManager: TaskTreeManager;
	private readonly _taskUsageView: TaskUsageView;
	private readonly _taskCountView: TaskCountView;
	private readonly _taskDetailsPage: TaskDetailsPage;
	private readonly _taskMonitorPage: MonitorPage;
	private readonly _configuration: IConfiguration;
	private readonly _configWatcher: TeConfigWatcher;
	// private readonly _telemetry: TelemetryService;
	private readonly _licenseManager: LicenseManager;
	private readonly _releaseNotesPage: ReleaseNotesPage;
	private readonly _previousVersion: string | undefined;
	private readonly _parsingReportPage: ParsingReportPage;
    private readonly _providers: IDictionary<ITaskExplorerProvider>;
	private readonly _onReady: EventEmitter<void>;
	// private _onInitialized: EventEmitter<void>;
	// private _onWorkCompleted: EventEmitter<void>;


	constructor(context: ExtensionContext, storage: IStorage, configuration: IConfiguration, log: ILog)
    {
		this._context = context;
        this._storage = storage;
        this._configuration = configuration;
		this._log = log;
		this._providers = {};
		this._onReady = new EventEmitter<void>();

		this._version = this._context.extension.packageJSON.version;
		this._previousVersion = this._storage.get<string>("taskexplorer.version");
		this._cacheBuster = this._storage.get<string>("taskexplorer.cacheBuster", getUuid());

		this._teContext = new TeContext();
		this._statusBar = new TeStatusBar();
		this._fileCache = new TeFileCache(this);
		this._fileWatcher = new TeFileWatcher(this);
		this._configWatcher = new TeConfigWatcher(this);

		this._server = new TeServer(this);
		this._licenseManager = new LicenseManager(this);

		this._treeManager = new TaskTreeManager(this);
        this._taskManager = new TaskManager(this);
        this._taskWatcher = new TaskWatcher(this);

		this._usage = new Usage(this);

		this._homeView = new HomeView(this);
		this._taskCountView = new TaskCountView(this);
		this._taskUsageView = new TaskUsageView(this);

		this._licensePage = new LicensePage(this);
		this._taskDetailsPage = new TaskDetailsPage(this);
		this._taskMonitorPage = new MonitorPage(this);
		this._parsingReportPage = new ParsingReportPage(this);
		this._releaseNotesPage = new ReleaseNotesPage(this);
		this._welcomePage = new WelcomePage(this);

		this._teApi = new TeApi(this);

		//
		// TODO - Telemetry
		//
		// teWrapper.telemetry.setGlobalAttributes({
		// 	debugging: container.debugging,
		// 	insiders: insiders,
		// 	prerelease: prerelease,
		// 	install: previousVersion == null,
		// 	upgrade: previousVersion != null && version !== previousVersion,
		// 	upgradedFrom: previousVersion != null && version !== previousVersion ? previousVersion : undefined,
		// });

		//
		// TODO - Telemetry
		//
		// const startTime = sw.startTime;
		// const endTime = hrtime();
		// const elapsed = sw.elapsed();
		// container.telemetry.sendEvent(
		// 	"activate",
		// 	{
		// 		"activation.elapsed": elapsed,
		// 		"activation.mode": mode?.name,
		// 		...flatCfg,
		// 	},
		// 	startTime,
		// 	endTime,
		// );

		this._disposables = [
			this._usage,
			this._onReady,
			this._homeView,
			this._statusBar,
            this._taskWatcher,
            this._taskManager,
			this._treeManager,
			this._licensePage,
			this._taskDetailsPage,
			this._taskMonitorPage,
			this._fileWatcher,
			this._configWatcher,
			this._taskCountView,
			this._taskUsageView,
			this._licenseManager,
			this._welcomePage,
			this._releaseNotesPage,
			this._parsingReportPage
		];

		context.subscriptions.push(this);
	}


	dispose()
	{
		this._disposables.forEach((d) =>  d.dispose());
        this._disposables.splice(0);
	}


	init = async() =>
	{
		if (this._initialized) {
			throw new Error("TeWrapper is already initialized/ready");
		}
		this.log.methodStart("app wrapper init", 1, "", false, [
			[ "version", this._version ], [ "previous version", this._previousVersion  ],
		]);
		await this.storage.update("taskexplorer.version", this._version);
		//
		// Register global commands
		//
		this.registerGlobalCommands();
		//
		// Register all task provider services, i.e. ant, batch, bash, python, etc...
		//
		this.registerTaskProviders();
		//
		// Init/register file type watchers
		// This "used" to also start the file scan to build the file task file cache. It now
		// does not on startup.  We use rebuildCache() below, so as to initiate one scan as
		// opposed to one scan per task type, like it did previously.  Note that if task types
		// are enabled or disabled in settings after startup, then the individual calls to
		// registerFileWatcher() will perform the scan for that task type.
		//
		await this._fileWatcher.init("   ");
		//
		// Context
		//
		this.registerContextMenuCommands();
		await this._teContext.setContext(ContextKeys.Debugging, this.debugging);
		await this._teContext.setContext(ContextKeys.Tests, this.tests);
        await this._teContext.setContext(ContextKeys.Enabled, this.config.get<boolean>("enableSideBar") ||
                   /* istanbul ignore next */ this.config.get<boolean>("enableExplorerView"));
		//
		// Signal we are ready/done
		//
		queueMicrotask(() => { this._initialized = true; /* this._onInitialized.fire();  */ });
		//
		// Start the whole work process, i.e. read task files and build the task tree, etc.
		// Large workspaces can take a bit of time if persistent caching isn't enabled, so
		// we do it now and not wait until the view is first visible/focused/activated.
		//
		queueMicrotask(() => this.run());
		this.log.methodDone("app wrapper init", 1);
	};


	private run = async() =>
	{
		this.log.methodStart("app wrapper run", 1, "", true);
		//
		// License / Authentication
		//
		await this.storage.deleteSecret("taskexplorer.licenseToken");
		await this.storage.deleteSecret("taskexplorer.licenseKey30Day");
		await this.storage.deleteSecret("taskexplorer.licenseKeyTrial");
		await this.storage.deleteSecret(StorageKeys.Account);
		await this.licenseManager.checkLicense("   ");

		//
		// Maybe show the 'what's new' or 'welcome' page if the version has changed ot this is
		// a new installation / first runtime.
		//
		/* istanbul ignore next */
		if (this.versionchanged)
		{
			this._cacheBuster = getUuid();
			await this._storage.update(StorageKeys.CacheBuster, this._cacheBuster);
			promiseUtils.oneTimeEvent(this.onReady)(() =>
			{
				if (!this.isNewInstall) {
					this._releaseNotesPage.show();
				}
				else {
					/* TODO - Show Welcome page */
					this._licensePage.show();
				}
			});
		}

		//
		// Build the file cache, this kicks off the whole process as refresh cmd will be issued
		// down the line in the initialization process.
		// On a workspace folder move that changes the 1st folder, VSCode restarts the extension.
		// To make the tree reload pain as light as possible, we now always persist the file cache
		// regardless if the user settings has activated it or not when the extension deactivates
		// in this scenario. So check this case and proceed as necessary.
		//
		const now = Date.now(),
			  lastDeactivated = await this.storage.get2<number>("lastDeactivated", 0),
			  lastWsRootPathChange = await this.storage.get2<number>("lastWsRootPathChange", 0),
			  rootFolderChanged  = now < lastDeactivated + 5000 && /* istanbul ignore next */now < lastWsRootPathChange + 5000;
		this._treeManager.setMessage(Strings.ScanningTaskFiles);
		/* istanbul ignore else */
		if (this.tests || /* istanbul ignore next */!rootFolderChanged)
		{
			await this.filecache.rebuildCache("   ");
		}     //
		else // See comments/notes above
		{   //
			const enablePersistentFileCaching = this.config.get<boolean>(ConfigKeys.EnablePersistenFileCache);
			this._configWatcher.enableConfigWatcher(false);
			await this.config.update(ConfigKeys.EnablePersistenFileCache, true);
			await this.filecache.rebuildCache("   ");
			await this.config.update(ConfigKeys.EnablePersistenFileCache, enablePersistentFileCaching);
			this._configWatcher.enableConfigWatcher(true);
		}
		await this.storage.update2("lastDeactivated", 0);
		await this.storage.update2("lastWsRootPathChange", 0);

		//
		// Write all usage stores to disk for examination, if we're in development mode
		//
		/* istanbul ignore next */
		if (this.env === "dev")
		{
			const account = await this._licenseManager.getAccount(),
				  rPath = await this.pathUtils.getInstallPath() + "\\dist\\",
				  taskUsage = this.storage.get<any>(StorageKeys.TaskUsage, {}),
				  allUsage = { usage: this._usage.getAll(), taskUsage, account };
			await this.fs.writeFile(rPath + "te.json", JSON.stringify(allUsage, null, 3));
		}

		//
		// Start the first tree build/load
		//
		this._treeManager.setMessage(Strings.RequestingTasks);
		await this._treeManager.loadTasks("   ");
		this._treeManager.setMessage(); // clear status bar message

		//
		// Log the environment
		//
		this.log.methodDone("app wrapper run", 1, "", [
			[ "machine id", env.machineId ], [ "session id", env.sessionId ], [ "app name", env.appName ],
			[ "remote name", env.remoteName ], [ "is new ap install", env.isNewAppInstall ]
		]);

		//
		// Signal that the startup work has completed.  `queueMicrotask` is interesting, I saw it
		// in the GitLens extension code, seems to sneak into the scheduler between each standard
		// scheduled task to run itself.  Might give a little boost on startup completion time when
		// queueMicrotask CPU resources with other extensions when VSCode starts up., i.e. notably
		// the f'ing Google Cloud Tools and Python interpreter.
		//
		queueMicrotask(() => { this._ready = true; this._onReady.fire(); });
	};


	private registerGlobalCommands = () =>
	{
		this._disposables.push(
			registerCommand(Commands.Donate, () => this.utils.openUrl("https://www.paypal.com/donate/?hosted_button_id=VNYX9PP5ZT5F8"), this),
			registerCommand(Commands.OpenBugReports, () => this.utils.openUrl("https://github.com/spmeesseman/vscode-taskexplorer/issues"), this),
			registerCommand(Commands.OpenRepository, () => this.utils.openUrl("https://github.com/spmeesseman/vscode-taskexplorer"), this)
		);
	};


	private registerContextMenuCommands = () =>
	{
		registerDisableTaskTypeCommand(this._disposables);
		registerEnableTaskTypeCommand(this._disposables);
		registerAddToExcludesCommand(this, this._disposables);
		registerRemoveFromExcludesCommand(this, this._disposables);
	};


    private registerTaskProvider = (providerName: string, provider: TaskExplorerProvider) =>
    {
        this._disposables.push(tasks.registerTaskProvider(providerName, provider));
        this._providers[providerName] = provider;
    };


	private registerTaskProviders = () =>
    {   //
        // Internal Task Providers
        //
        // These tak types are provided internally by the extension.  Some task types (npm, grunt,
        //  gulp, ts) are provided by VSCode itself
        //
        // TODO: VSCODE API now implements "resolveTask" in addition to "provideTask".  Need to implement
        //     https://code.visualstudio.com/api/extension-guides/task-provider
        //
        this.registerTaskProvider("ant", new AntTaskProvider(this));                    // Apache Ant Build Automation Tool
        this.registerTaskProvider("apppublisher", new AppPublisherTaskProvider(this));  // App Publisher (work related)
        this.registerTaskProvider("composer", new ComposerTaskProvider(this));          // PHP / composer.json
        this.registerTaskProvider("gradle", new GradleTaskProvider(this));              // Gradle multi-Language Automation Tool
        this.registerTaskProvider("grunt", new GruntTaskProvider(this));                // Gulp JavaScript Toolkit
        this.registerTaskProvider("gulp", new GulpTaskProvider(this));                  // Grunt JavaScript Task Runner
        this.registerTaskProvider("jenkins", new JenkinsTaskProvider(this));            // Jenkinsfile validation task
        this.registerTaskProvider("make", new MakeTaskProvider(this));                  // C/C++ Makefile
        this.registerTaskProvider("maven", new MavenTaskProvider(this));                // Apache Maven Toolset
        this.registerTaskProvider("pipenv", new PipenvTaskProvider(this));              // Pipfile for Python pipenv package manager
        this.registerTaskProvider("webpack", new WebpackTaskProvider(this));
        // Script type tasks
        this.registerTaskProvider("bash", new BashTaskProvider(this));
        this.registerTaskProvider("batch", new BatchTaskProvider(this));
        this.registerTaskProvider("nsis", new NsisTaskProvider(this));
        this.registerTaskProvider("perl", new PerlTaskProvider(this));
        this.registerTaskProvider("powershell", new PowershellTaskProvider(this));
        this.registerTaskProvider("python", new PythonTaskProvider(this));
        this.registerTaskProvider("ruby", new RubyTaskProvider(this));
    };


	get api(): TeApi {
		return this._teApi;
	}

	get busy(): boolean {
		return this._busy || !this._ready || !this._initialized || this._fileCache.isBusy() || this._treeManager.isBusy() ||
			   this._fileWatcher.isBusy() || this._configWatcher.isBusy() || this._licenseManager.isBusy;
	}

	get cacheBuster(): string {
		return this._cacheBuster;
	}

	get commonUtils(): typeof commonUtils {
		return commonUtils;
	}

	get config(): IConfiguration {
		return this._configuration;
	}

	get configWatcher(): TeConfigWatcher {
		return this._configWatcher;
	}

	get context(): ExtensionContext {
		return this._context;
	}

	get contextTe(): TeContext {
		return this._teContext;
	}

	get debugging(): boolean {
		return this._context.extensionMode === ExtensionMode.Development;
	}

	get env(): "dev" | "tests" | "production" {
		const isDev = this._context.extensionMode === ExtensionMode.Development,
			  isTests = this._context.extensionMode === ExtensionMode.Test;
		/* istanbul ignore next */
		return !isDev && !isTests ? "production" : (isDev ? "dev" : "tests");
	}

    get explorer(): TaskTree {
        return this.treeManager.views.taskExplorer.tree;
    }

    get explorerView(): TreeView<TreeItem> {
        return this.treeManager.views.taskExplorer.view;
    }

	get figures(): typeof figures {
		return figures;
	}

	get filecache(): TeFileCache {
		return this._fileCache;
	}

	get fileWatcher(): TeFileWatcher {
		return this._fileWatcher;
	}

	get fs(): ITeFilesystem {
		return fs;
	}

	get homeView(): HomeView {
		return this._homeView;
	}

	get id(): string {
		return this._context.extension.id;
	}

	get isNewInstall(): boolean {
		return this.versionchanged && this._previousVersion === undefined;
	}

	get log(): ILog {
		return this._log;
	}

	get logControl(): typeof logControl {
		return logControl;
	}

	// get onInitialized() {
	// 	return this._onInitialized.event;
	// }

	get onReady() {
		return this._onReady.event;
	}

	get providers(): IDictionary<ITaskExplorerProvider> {
		return this._providers;
	}

	get licenseManager(): LicenseManager {
		return this._licenseManager;
	}

	get licensePage(): LicensePage {
		return this._licensePage;
	}

	get parsingReportPage(): ParsingReportPage {
		return this._parsingReportPage;
	}

	get pathUtils(): ITePathUtilities {
		return pathUtils;
	}

	get promiseUtils(): ITePromiseUtilities {
		return promiseUtils;
	}

	get releaseNotesPage(): ReleaseNotesPage {
		return this._releaseNotesPage;
	}

	get server(): TeServer {
		return this._server;
	}

    get sidebar(): TaskTree {
        return this.treeManager.views.taskExplorerSideBar.tree;
    }

    get sidebarView(): TreeView<TreeItem> {
        return this.treeManager.views.taskExplorerSideBar.view;
    }

    get sorters(): ITeSortUtilities {
        return sorters;
    }

	get statusBar(): TeStatusBar {
		return this._statusBar;
	}

	get storage(): IStorage {
		return this._storage;
	}

	get taskCountView(): TaskCountView {
		return this._taskCountView;
	}

	get taskDetailsPage(): TaskDetailsPage {
		return this._taskDetailsPage;
	}

	get taskManager(): TaskManager {
		return this._taskManager;
	}

	get taskMonitorPage(): MonitorPage {
		return this._taskMonitorPage;
	}

	get taskUsageView(): TaskUsageView {
		return this._taskUsageView;
	}

	get taskUtils(): ITeTaskUtilities {
		return taskUtils;
	}

	get taskWatcher(): TaskWatcher {
		return this._taskWatcher;
	}

	get tests(): boolean {
		return this._tests || this._context.extensionMode === ExtensionMode.Test;
	}

	set tests(v) {
		this._tests = v;
	}

	get treeManager(): TaskTreeManager {
		return this._treeManager;
	}

	get usage(): Usage {
		return this._usage;
	}

	get utils(): ITeUtilities {
		return utilities;
	}

	get version(): string {
		return this._version;
	}

	get versionchanged(): boolean {
		return this._version !== this._previousVersion;
	}

    get views() {
        return this.treeManager.views;
    }

	get welcomePage(): WelcomePage {
		return this._welcomePage;
	}

	get wsfolder(): WorkspaceFolder {
		return (workspace.workspaceFolders as WorkspaceFolder[])[0];
	}

	// get telemetry(): TelemetryService {
	// 	return this._telemetry;
	// }

}

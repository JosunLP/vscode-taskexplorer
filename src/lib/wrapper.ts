
import { TeApi } from "./api";
import { Usage } from "./usage";
import * as fs from "./utils/fs";
import { TeLog } from "./utils/log";
import { TeServer } from "./server";
import { getUuid } from ":env/crypto";
import { TeContext } from "./context";
import { TeMigration } from "./migration";
import { figures } from "./utils/figures";
import { TeStatusBar } from "./statusBar";
import * as objUtils from "./utils/object";
import * as utilities from "./utils/utils";
import { LicenseManager } from "./license";
import * as pathUtils from "./utils/pathUtils";
import * as taskUtils from "./utils/taskUtils";
import * as typeUtils from "./utils/typeUtils";
import { EventQueue } from "./utils/eventQueue";
import { TeFileCache } from "../task/fileCache";
import { initStorage, storage } from "./storage";
import { TaskTreeManager } from "../tree/manager";
import { All as AllConstants } from "./constants";
import { TaskManager } from "../task/taskManager";
import { TaskWatcher } from "../task/taskWatcher";
import { HomeView } from "../webview/view/homeView";
import { TeFileWatcher } from "../task/fileWatcher";
import * as promiseUtils from "./utils/promiseUtils";
import { WelcomePage } from "../webview/page/welcome";
import { AntTaskProvider } from "../task/provider/ant";
import { NpmTaskProvider } from "../task/provider/npm";
import { BashTaskProvider } from "../task/provider/bash";
import { GulpTaskProvider } from "../task/provider/gulp";
import { MakeTaskProvider } from "../task/provider/make";
import { RubyTaskProvider } from "../task/provider/ruby";
import { NsisTaskProvider } from "../task/provider/nsis";
import { PerlTaskProvider } from "../task/provider/perl";
import { LicensePage } from "../webview/page/licensePage";
import { MonitorPage } from "../webview/page/monitorPage";
import { BatchTaskProvider } from "../task/provider/batch";
import { MavenTaskProvider } from "../task/provider/maven";
import { GruntTaskProvider } from "../task/provider/grunt";
import { GradleTaskProvider } from "../task/provider/gradle";
import { PipenvTaskProvider } from "../task/provider/pipenv";
import { PythonTaskProvider } from "../task/provider/python";
import { TaskCountView } from "../webview/view/taskCountView";
import { TaskUsageView } from "../webview/view/taskUsageView";
import { AddToExcludesCommand } from "./command/addToExcludes";
import { WebpackTaskProvider } from "../task/provider/webpack";
import { JenkinsTaskProvider } from "../task/provider/jenkins";
import { ReleaseNotesPage } from "../webview/page/releaseNotes";
import { EnableTaskTypeCommand } from "./command/enableTaskType";
import { ComposerTaskProvider } from "../task/provider/composer";
import { TaskExplorerProvider } from "../task/provider/provider";
import { DisableTaskTypeCommand } from "./command/disableTaskType";
import { configuration, initConfiguration } from "./configuration";
import { PowershellTaskProvider } from "../task/provider/powershell";
import { debounceCommand, registerCommand } from "./command/command";
import { ParsingReportPage } from "../webview/page/parsingReportPage";
import { AppPublisherTaskProvider } from "../task/provider/appPublisher";
import { RemoveFromExcludesCommand } from "./command/removeFromExcludes";
import {
	ExtensionContext, ExtensionMode, tasks, workspace, WorkspaceFolder, env, TreeItem, TreeView,
	Disposable, EventEmitter, Event
} from "vscode";
import {
	IConfiguration, ITaskExplorerProvider, IStorage, ITaskTreeView, ITeFilesystem, ITePathUtilities,
	ITePromiseUtilities, ITeStatusBar, ITeTaskTree, ITeTaskUtilities, ITeTypeUtilities, ITeUtilities,
	ILog, ITeWrapper, TeRuntimeEnvironment, ITeKeys, IDictionary, ILogControl, ITeObjectUtilities, ISpmServer
} from "../interface";


export class TeWrapper implements ITeWrapper, Disposable
{
    private static _instance: TeWrapper;

	private _ready = false;
	private _busy = false;
	private _initialized = false;
	private _cacheBuster: string;

	private readonly _log: TeLog;
	private readonly _usage: Usage;
	private readonly _teApi: TeApi;
	private readonly _version: string;
	private readonly _server: TeServer;
	private readonly _storage: IStorage;
	private readonly _homeView: HomeView;
	private readonly _teContext: TeContext;
	// private readonly _localize: nls.LocalizeFunc;
	private readonly _fileCache: TeFileCache;
	private readonly _statusBar: TeStatusBar;
    private readonly _eventQueue: EventQueue;
	private readonly _licensePage: LicensePage;
	private readonly _welcomePage: WelcomePage;
    private readonly _taskManager: TaskManager;
	private readonly _disposables: Disposable[];
	private readonly _context: ExtensionContext;
	private readonly _fileWatcher: TeFileWatcher;
	private readonly _treeManager: TaskTreeManager;
	private readonly _taskUsageView: TaskUsageView;
	private readonly _taskCountView: TaskCountView;
	private readonly _taskMonitorPage: MonitorPage;
	private readonly _configuration: IConfiguration;
	// private readonly _telemetry: TelemetryService;
	private readonly _licenseManager: LicenseManager;
	private readonly _releaseNotesPage: ReleaseNotesPage;
	private readonly _previousVersion: string | undefined;
	private readonly _parsingReportPage: ParsingReportPage;
	private readonly _onReady: EventEmitter<void>;
    private readonly _onInitialized: EventEmitter<void>;
    private readonly _onBusyComplete: EventEmitter<void>;
    private readonly _providers: Record<string, ITaskExplorerProvider>;
	private readonly _envMap: IDictionary<TeRuntimeEnvironment> = { production: "production", development: "dev", test: "tests" };


	static async create(context: ExtensionContext): Promise<TeWrapper>
	{   //
		// TODO - Handle untrusted workspace
		//
		// if (!workspace.isTrusted) {
		// 	void setContext(ContextKeys.Untrusted, true);
		// 	context.subscriptions.push(
		// 		workspace.onDidGrantWorkspaceTrust(() => {
		// 			void setContext(ContextKeys.Untrusted, undefined);
		// 			container.telemetry.setGlobalAttribute('workspace.isTrusted', workspace.isTrusted);
		// 		}),
		// 	);
		// }
		//
		// Initialize configuration
		//
		initConfiguration(context);
		//
		// Initialize storage
		//
		await initStorage(context);
		//
		// Instantiate and initialize the logging module
		//
		const log = new TeLog(context, configuration);
		log.write("activating extension", 1);
		//
		// Perform any necessary migration to configuration and storage, pre-wrapper initialization
		//
		const migration = new TeMigration(storage, configuration);
		await migration.migrateSettings();
		await migration.migrateStorage();
		//
		// Instantiate the application wrapper
		//
		this._instance = new TeWrapper(context, storage, configuration, log);
		//
		// Complete log initialization now that wrapper instance has been created.  Using the
		// log.wrapper setter will initiate source map installation for error tracing
		//
		log.wrapper = this._instance;
		//
		// Initialize the application wrapper
		//
		await this._instance.init();
		log.write("extension activation completed successfully, work pending", 1);
		return this._instance;
	}


	constructor(context: ExtensionContext, storage: IStorage, configuration: IConfiguration, log: TeLog)
    {
		this._log = log;
		this._providers = {};
		this._context = context;
        this._storage = storage;
        this._configuration = configuration;

		this._eventQueue = new EventQueue(this);
		this._onReady = new EventEmitter<void>();
		this._onInitialized = new EventEmitter<void>();
		this._onBusyComplete = new EventEmitter<void>();

		this._version = this._context.extension.packageJSON.version;
		this._previousVersion = this._storage.get<string>("taskexplorer.version");
		this._cacheBuster = this._storage.get<string>("taskexplorer.cacheBuster", getUuid());

		//
		// TODO - Localization
		//
		Object.entries<string>(AllConstants.Strings).filter(s => s[1].includes("|")).forEach(e =>
		{
			const lPair = e[1].split("|");
			(<IDictionary<string>>AllConstants.Strings)[e[0]] = this.localize(lPair[0], lPair[1]);
		});

		this._teContext = new TeContext();
		this._statusBar = new TeStatusBar(this);
		this._fileCache = new TeFileCache(this);
		this._fileWatcher = new TeFileWatcher(this);

		this._server = new TeServer(this);
        this._taskManager = new TaskManager(this);
		this._treeManager = new TaskTreeManager(this);

		this._licenseManager = new LicenseManager(this, this._server);
		this._usage = new Usage(this);

		this._homeView = new HomeView(this);
		this._taskCountView = new TaskCountView(this);
		this._taskUsageView = new TaskUsageView(this);

		this._licensePage = new LicensePage(this);
		this._taskMonitorPage = new MonitorPage(this);
		this._parsingReportPage = new ParsingReportPage(this);
		this._releaseNotesPage = new ReleaseNotesPage(this);
		this._welcomePage = new WelcomePage(this);

		this._teApi = new TeApi(this);

		//
		// TODO - Telemetry
		//
		// Example from GitLens extension:
		//
		//     this._telemetry.setGlobalAttributes({
		//     	   dev: this.dev
		//     });
		//     const startTime = sw.startTime,
		//           endTime = hrtime(),
		//           elapsed = sw.elapsed();
		//     this._telemetry.sendEvent("activate", {
		//     		"activation.elapsed": elapsed,
		//     		"activation.mode": mode?.name
		//     }, startTime, endTime);

		this._disposables = [
			{ dispose: () => { console.log("dispose1"); }},
			this._eventQueue,
			this._teApi,
			{ dispose: () => { console.log("dispose1.5"); }},
			this._usage,
			this._onReady,
			{ dispose: () => { console.log("dispose2"); }},
			this._homeView,
			this._statusBar,
			this._teContext,
			{ dispose: () => { console.log("dispose2.5"); }},
            this._taskManager,
			this._treeManager,
			this._licensePage,
			{ dispose: () => { console.log("dispose3"); }},
			this._taskMonitorPage,
			this._fileWatcher,
			this._fileCache,
			this._taskCountView,
			{ dispose: () => { console.log("dispose4"); }},
			this._taskUsageView,
			this._onInitialized,
			this._onBusyComplete,
			this._licenseManager,
			{ dispose: () => { console.log("dispose5"); }},
			this._welcomePage,
			this._releaseNotesPage,
			this._parsingReportPage
		];

		context.subscriptions.push(this);
	}

	dispose()
	{
		this._disposables.forEach(d => d.dispose());
        this._disposables.splice(0);
	}


	init = async() =>
	{
		if (this._initialized) {
			throw new Error("TeWrapper is already initialized/ready");
		}
		this.log.methodStart("app wrapper - init", 1, "", false, [
			[ "version", this._version ], [ "previous version", this._previousVersion  ],
		]);
		await this.storage.update(AllConstants.Storage.Version, this._version);
		//
		// Register busy complete event
		//
		this.registerBusyCompleteEvent();
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
		await this._teContext.setContext(AllConstants.Context.Dev, this.dev);
		await this._teContext.setContext(AllConstants.Context.Tests, this.tests);
        await this._teContext.setContext(AllConstants.Context.Enabled, this.utils.isTeEnabled());
		this._disposables.push(
			this._teContext.onDidChangeContext(() => {}, this) // cover until used somewhere
		);
		//
		// Signal we are ready/done
		//
		queueMicrotask(() => { this._initialized = true; this._onInitialized.fire(); });
		//
		// Start the whole work process, i.e. read task files and build the task tree, etc.
		// Large workspaces can take a bit of time if persistent caching isn't enabled, so
		// we do it now and not wait until the view is first visible/focused/activated.
		//
		queueMicrotask(() => this.run());
		this.log.methodDone("app wrapper - init", 1);
	};


	private run = async() =>
	{
		await utilities.sleep(1);
		this.log.methodStart("app wrapper - run", 1, "", true);
		//
		// License / Authentication
		//
		// await this.storage.deleteSecret(StorageKeys.Account); // For testing
		await this.licenseManager.checkLicense("   ");
		//
		// Maybe show the 'what's new' or 'welcome' page if the version has changed ot this is
		// a new installation / first runtime.
		//
		this.log.write("   check version change / update", 2);
		await utilities.execIf(this.versionchanged, async () =>
		{
			this.log.write("   version has changed", 1);
			this.log.value("      previous version", this._previousVersion, 1);
			this.log.value("      new version", this._version, 1);
			this._cacheBuster = getUuid();
			await this._storage.update(AllConstants.Storage.CacheBuster, this._cacheBuster);
			promiseUtils.oneTimeEvent(this.onReady)(() =>
			{
				/* istanbul ignore if */
				if (!this.isNewInstall) {
					void this._releaseNotesPage.show();
				}
				else {
					void this._welcomePage.show();
				}
			}, this);
		}, this);
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
		this._treeManager.setMessage(AllConstants.Strings.ScanningTaskFiles);
		/* istanbul ignore else */
		if (this.tests || /* istanbul ignore next */!rootFolderChanged)
		{
			await this._statusBar.runWithProgress<number>(() => this.fileCache.rebuildCache("   "));
			// await this.fileCache.rebuildCache("   "); // ^^^ Cover runWithProgress() for now
		}     //
		else // See comments/notes above
		{   //
			const enablePersistentFileCaching = this.config.get<boolean>(AllConstants.Config.EnablePersistenFileCache);
			this._treeManager.configWatcher.enableConfigWatcher(false);
			await this.config.update(AllConstants.Config.EnablePersistenFileCache, true);
			await this._statusBar.runWithProgress<number>(() => this.fileCache.rebuildCache("   "));
			// await this.fileCache.rebuildCache("   "); // ^^^ Cover runWithProgress() for now
			await this.config.update(AllConstants.Config.EnablePersistenFileCache, enablePersistentFileCaching);
			this._treeManager.configWatcher.enableConfigWatcher(true);
		}
		await this.storage.update2("lastDeactivated", 0);
		await this.storage.update2("lastWsRootPathChange", 0);
		//
		// For Testing
		// Write all usage stores to disk for examination, if we're in development mode
		//
		// if (this.env === "dev")
		// {
		// 	const account = this._licenseManager.account,
		// 		  rPath = await this.pathUtils.getInstallPath() + "\\dist\\",
		// 		  taskUsage = this.storage.get<any>(StorageKeys.TaskUsage, {}),
		// 		  allData = { usage: this._usage.getAll(), taskUsage, account };
		// 	await this.fs.writeFile(rPath + "te_data.json", JSON.stringify(allData, null, 3));
		// }
		//
		// Start the first tree build/load
		//
		promiseUtils.oneTimeEvent(this._treeManager.onReady)(() => {}); // cover onReady (hv used not used, 10x<->)
		this._treeManager.setMessage(AllConstants.Strings.RequestingTasks);
		await this._treeManager.refresh(undefined, undefined, "   ");
		this._treeManager.setMessage(); // clear status bar message
		//
		// Signal that the startup work has completed.  `queueMicrotask` is interesting, I saw it
		// in the GitLens extension code, seems to sneak into the scheduler between each standard
		// scheduled task to run itself.  Might give a little boost on startup completion time when
		// queueMicrotask CPU resources with other extensions when VSCode starts up., i.e. notably
		// the f'ing Google Cloud Tools and Python interpreter.
		//
		this.log.write("   queue wrapper ready event", 2);
		queueMicrotask(() => { this._ready = true; this._onReady.fire(); });
		//
		// Log the environment
		//
		this.log.methodDone("app wrapper - run", 1, "", [
			[ "machine id", env.machineId ], [ "session id", env.sessionId ], [ "app name", env.appName ],
			[ "remote name", env.remoteName ], [ "new install", env.isNewAppInstall ]
		]);
	};


	private registerBusyCompleteEvent = () =>
	{
		const _event = () => {
			debounceCommand("wrapper.event.busy", () => { if (!this.busy) this._onBusyComplete.fire(); }, 150, this);
		};
		this._disposables.push(
			// this.onReady(() => _event()),
			this.fileCache.onReady(_event),
			this.fileWatcher.onReady(_event),
			this.licenseManager.onReady(_event),
			this.treeManager.configWatcher.onReady(_event),
			this.treeManager.onDidAllTasksChange(_event)
		);
	};


	private registerGlobalCommands = () =>
	{
		this._disposables.push(
			registerCommand(AllConstants.Commands.Donate, () => this.utils.openUrl("https://www.paypal.com/donate/?hosted_button_id=VNYX9PP5ZT5F8"), this),
			registerCommand(AllConstants.Commands.OpenBugReports, () => this.utils.openUrl(`https://github.com/${this.extensionAuthor}/${this.extensionName}/issues`), this)
		);
	};


	private registerContextMenuCommands = () =>
	{
		this._disposables.push(
			new DisableTaskTypeCommand(this),
			new EnableTaskTypeCommand(this),
			new AddToExcludesCommand(this),
			new RemoveFromExcludesCommand(this)
		);
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
        this.registerTaskProvider("npm", new NpmTaskProvider(this));                    // Node Package Manager
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


	waitReady = async (ignoreModule: any[] = [], minWait = 1, maxWait = 15000) => {}; // this._waitUtils.waitReady(ignoreModule, minWait, maxWait);


	static get instance() { return this._instance; }
	get api(): TeApi { return this._teApi; }
	get busy(): boolean {
		return this._busy || !this._ready || !this._initialized || this._fileCache.isBusy || this._treeManager.isBusy ||
			   this._fileWatcher.isBusy || this._licenseManager.isBusy;
	}
	get busyWebviews(): boolean {
		return this._licensePage.isBusy || this._parsingReportPage.isBusy || this._releaseNotesPage.isBusy || this._homeView.isBusy ||
			   this._taskUsageView.isBusy || this._taskCountView.isBusy || this._welcomePage.isBusy;
	}
	get cacheBuster(): string { return this._cacheBuster; }
	get config(): IConfiguration { return this._configuration; }
	get context(): ExtensionContext { return this._context; }
	get contextTe(): TeContext { return this._teContext; }
	get dev(): boolean { return this._context.extensionMode === ExtensionMode.Development; }
	get env(): TeRuntimeEnvironment { return this._envMap[ExtensionMode[this._context.extensionMode].toLowerCase()]; }
	get eventQueue(): EventQueue { return this._eventQueue; }
    get explorer(): ITeTaskTree { return this.treeManager.views.taskExplorer.tree; }
    get explorerView(): TreeView<TreeItem> { return this.treeManager.views.taskExplorer.view; }
	get extensionAuthor(): string { return this.extensionId.substring(0, this.extensionId.indexOf(".")); }
	get extensionId(): string { return this._context.extension.id; }
	get extensionName(): string { return this.extensionId.replace(`${this.extensionAuthor}.`, ""); }
	get extensionNameShort(): string { return this.extensionName.replace("vscode-", ""); }
	get extensionTitle(): string {return this.localize("name", this._context.extension.packageJSON.displayName); }
	get extensionTitleShort(): string { return this.extensionTitle; }
	get figures(): typeof figures { return figures; }
	get fileCache(): TeFileCache { return this._fileCache; }
	get fileWatcher(): TeFileWatcher { return this._fileWatcher; }
	get fs(): ITeFilesystem { return fs; }
	get homeView(): HomeView { return this._homeView; }
	get isNewInstall(): boolean { return this.versionchanged && this._previousVersion === undefined; }
	get isReady(): boolean { return this._ready; }
	get keys(): ITeKeys { return AllConstants; }
	get licenseManager(): LicenseManager { return this._licenseManager; }
	get licensePage(): LicensePage { return this._licensePage; }
	//
	// TODO - Localization
	//
	localize = (_key: string, defaultMessage: string): string => defaultMessage; // this._localize(key, defaultMessage);
	get log(): ILog { return this._log; }
	get logControl(): ILogControl { return this._log.control; }
	get objUtils(): ITeObjectUtilities { return objUtils; }
	get onReady(): Event<void> { return this._onReady.event; }
	get parsingReportPage(): ParsingReportPage { return this._parsingReportPage; }
	get production(): boolean { return this._context.extensionMode === ExtensionMode.Production; }
	get providers(): Record<string, ITaskExplorerProvider> { return this._providers; }
	get pathUtils(): ITePathUtilities { return pathUtils; }
	get promiseUtils(): ITePromiseUtilities { return promiseUtils; }
	get releaseNotesPage(): ReleaseNotesPage { return this._releaseNotesPage; }
    get server(): ISpmServer { return this._server; }
    get sidebar(): ITeTaskTree { return this.treeManager.views.taskExplorerSideBar.tree; }
    get sidebarView(): TreeView<TreeItem> { return this.treeManager.views.taskExplorerSideBar.view; }
	get statusBar(): ITeStatusBar { return this._statusBar; }
	get storage(): IStorage { return this._storage; }
	get taskCountView(): TaskCountView { return this._taskCountView; }
	get taskManager(): TaskManager { return this._taskManager; }
	get taskMonitorPage(): MonitorPage { return this._taskMonitorPage; }
	get taskUsageView(): TaskUsageView { return this._taskUsageView; }
	get taskUtils(): ITeTaskUtilities { return taskUtils; }
	get typeUtils(): ITeTypeUtilities { return typeUtils; }
	get taskWatcher(): TaskWatcher { return this._taskManager.watcher; }
	get tests(): boolean { return this._context.extensionMode === ExtensionMode.Test; }
	get treeManager(): TaskTreeManager { return this._treeManager; }
	get usage(): Usage { return this._usage; }
	get utils(): ITeUtilities { return utilities; }
	get version(): string { return this._version; }
	get versionchanged(): boolean { return this._version !== this._previousVersion; }
    get views(): { [id in "taskExplorer" | "taskExplorerSideBar"]: ITaskTreeView } { return this.treeManager.views; }
	get welcomePage(): WelcomePage { return this._welcomePage; }
	get wsfolder(): WorkspaceFolder { return (workspace.workspaceFolders as WorkspaceFolder[])[0]; }
	// get telemetry(): TelemetryService { 	return this._telemetry; }

}
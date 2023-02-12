
import { TeApi } from "./api";
import * as fs from "./utils/fs";
import * as fileCache from "./fileCache";
import { TaskTree } from "src/tree/tree";
import * as utilities from "./utils/utils";
import { IStorage } from "../interface/IStorage";
import { AntTaskProvider } from "../providers/ant";
import { HomeView } from "../webview/view/homeView";
import { ContextKeys, setContext } from "./context";
import { BashTaskProvider } from "../providers/bash";
import { GulpTaskProvider } from "../providers/gulp";
import { MakeTaskProvider } from "../providers/make";
import { RubyTaskProvider } from "../providers/ruby";
import { NsisTaskProvider } from "../providers/nsis";
import { PerlTaskProvider } from "../providers/perl";
import { UsageWatcher } from "./watcher/usageWatcher";
import { TaskTreeManager } from "../tree/treeManager";
import { LicenseManager } from "./auth/licenseManager";
import { BatchTaskProvider } from "../providers/batch";
import { MavenTaskProvider } from "../providers/maven";
import { GruntTaskProvider } from "../providers/grunt";
import { registerStatusBarItem } from "./statusBarItem";
import { GradleTaskProvider } from "../providers/gradle";
import { PipenvTaskProvider } from "../providers/pipenv";
import { PythonTaskProvider } from "../providers/python";
import { LicensePage } from "../webview/page/licensePage";
import { registerDonateCommand } from "../commands/donate";
import { WebpackTaskProvider } from "../providers/webpack";
import { JenkinsTaskProvider } from "../providers/jenkins";
import { isProcessingFsEvent, registerFileWatchers } from "./watcher/fileWatcher";
import { ComposerTaskProvider } from "../providers/composer";
import { TaskExplorerProvider } from "../providers/provider";
import { IConfiguration } from "../interface/IConfiguration";
import { TaskCountView } from "../webview/view/taskCountView";
import { TaskUsageView } from "../webview/view/taskUsageView";
import { TeAuthenticationProvider } from "./auth/authProvider";
import { ReleaseNotesPage } from "../webview/page/releaseNotes";
import { IDictionary, ILog, ITaskTreeView } from "../interface";
import { PowershellTaskProvider } from "../providers/powershell";
import { ITaskExplorerProvider } from "../interface/ITaskProvider";
import { AppPublisherTaskProvider } from "../providers/appPublisher";
import { ParsingReportPage } from "../webview/page/parsingReportPage";
import { registerAddToExcludesCommand } from "../commands/addToExcludes";
import { registerEnableTaskTypeCommand } from "../commands/enableTaskType";
import { registerDisableTaskTypeCommand } from "../commands/disableTaskType";
import { registerRemoveFromExcludesCommand } from "../commands/removeFromExcludes";
import { ExtensionContext, EventEmitter, ExtensionMode, tasks, workspace, WorkspaceFolder, env } from "vscode";
import { enableConfigWatcher, isProcessingConfigChange, registerConfigWatcher } from "./watcher/configWatcher";


export class TeWrapper
{
	private _ready = false;
	private _tests = false;
	private _busy = false;
	private _initialized = false;

	private readonly _log: ILog;
	private readonly _teApi: TeApi;
	private readonly _version: string;
	private readonly _storage: IStorage;
	private readonly _homeView: HomeView;
	private readonly _usage: UsageWatcher;
	private readonly _licensePage: LicensePage;
	private readonly _context: ExtensionContext;
	private readonly _treeManager: TaskTreeManager;
	private readonly _taskUsageView: TaskUsageView;
	private readonly _taskCountView: TaskCountView;
	private readonly _configuration: IConfiguration;
	// private readonly _telemetry: TelemetryService;
	private readonly _licenseManager: LicenseManager;
	private readonly _releaseNotesPage: ReleaseNotesPage;
	private readonly _previousVersion: string | undefined;
	private readonly _parsingReportPage: ParsingReportPage;
    private readonly _providers: IDictionary<ITaskExplorerProvider>;
	private _onReady: EventEmitter<void> = new EventEmitter<void>();
	private _onInitialized: EventEmitter<void> = new EventEmitter<void>();
	// private _onWorkCompleted: EventEmitter<void> = new EventEmitter<void>();


	static create(context: ExtensionContext, storage: IStorage, configuration: IConfiguration, log: ILog)
    {
		return new TeWrapper(context, storage, configuration, log);
	}


	private constructor(context: ExtensionContext, storage: IStorage, configuration: IConfiguration, log: ILog)
    {
		this._context = context;
        this._storage = storage;
        this._configuration = configuration;
		this._log = log;
		this._providers = {};

		this._version = this._context.extension.packageJSON.version;
		this._previousVersion = this._storage.get<string>("taskExplorer.version");

		this._licenseManager = new LicenseManager(this);
		this._treeManager = new TaskTreeManager(this);
		this._usage = new UsageWatcher(this, storage);

		this._homeView = new HomeView(this);
		this._taskCountView = new TaskCountView(this);
		this._taskUsageView = new TaskUsageView(this);

		this._licensePage = new LicensePage(this);
		this._parsingReportPage = new ParsingReportPage(this);
		this._releaseNotesPage = new ReleaseNotesPage(this);

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

		context.subscriptions.push(
			this._homeView ,
			this._licenseManager,
			this._licensePage,
			this._parsingReportPage,
			this._releaseNotesPage,
			this._taskCountView,
			this._taskUsageView,
			this._treeManager,
			this._usage
		);
	}


	get onInitialized() {
		return this._onReady.event;
	}


	get onReady() {
		return this._onReady.event;
	}


	init = async() =>
	{
		if (this._initialized) {
			throw new Error("TeWrapper is already initialized/ready");
		}
		this.log.methodStart("task explorer app wrapper ready", 1);
		//
		// Register global status bar item
		//
		registerStatusBarItem(this._context);
		//
		// Register all task provider services, i.e. ant, batch, bash, python, etc...
		//
		this.registerTaskProviders();
		//
		// Register the configuration/settings watcher
		//
		registerConfigWatcher(this);
		//
		// Register file cache manager
		//
		await fileCache.registerFileCache(this);
		//
		// Register file type watchers
		// This "used" to also start the file scan to build the file task file cache. It now
		// does not on startup.  We use rebuildCache() below, so as to initiate one scan as
		// opposed to one scan per task type, like it did previously.  Note that if task types
		// are enabled or disabled in settings after startup, then the individual calls to
		// registerFileWatcher() will perform the scan for that task type.
		//
		await registerFileWatchers(this._context, "   ");
		//
		// Context
		//
		this.registerContextMenuCommands();
		await setContext(ContextKeys.Debugging, this.debugging);
		await setContext(ContextKeys.Tests, this.tests);
        await setContext(ContextKeys.Enabled, this.config.get<boolean>("enableSideBar") ||
                                              this.config.get<boolean>("enableExplorerView"));
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
		this.log.methodDone("task explorer app wrapper ready", 1);
	};


	private run = async() =>
	{
		const now = Date.now(),
			  lastDeactivated = await this.storage.get2<number>("lastDeactivated", 0),
			  lastWsRootPathChange = await this.storage.get2<number>("lastWsRootPathChange", 0);
		this.log.methodStart("task explorer app wrapper run", 1, "", true);
		//
		// Authentication
		//
		await this.licenseManager.checkLicense("   ");
		// const session = await licenseManager.getSession("TeAuth", [], { create: true });
		// if (session) {
		//     window.showInformationMessage(`Welcome back ${session.account.name}`);
		// }
		//
		// Build the file cache, this kicks off the whole process as refresh cmd will be issued
		// down the line in the initialization process.
		// On a workspace folder move that changes the 1st folder, VSCode restarts the extension.
		// To make the tree reload pain as light as possible, we now always persist the file cache
		// regardless if the user settings has activated it or not when the extension deactivates
		// in this scenario. So check this case and proceed as necessary.
		//
		const rootFolderChanged  = now < lastDeactivated + 5000 && /* istanbul ignore next */now < lastWsRootPathChange + 5000;
		/* istanbul ignore else */
		if (this.tests || /* istanbul ignore next */!rootFolderChanged)
		{
			await this.filecache.rebuildCache("   ");
		}     //
		else // See comments/notes above
		{   //
			const enablePersistentFileCaching = this.config.get<boolean>("enablePersistentFileCaching");
			enableConfigWatcher(false);
			await this.config.update("enablePersistentFileCaching", true);
			await this.filecache.rebuildCache("   ");
			await this.config.update("enablePersistentFileCaching", enablePersistentFileCaching);
			enableConfigWatcher(true);
		}

		await this.storage.update2("lastDeactivated", 0);
		await this.storage.update2("lastWsRootPathChange", 0);
		//
		// Start the first tree build/load
		//
		await this.treeManager.loadTasks("   ");
		//
		// Log the environment
		//
		this.log.methodDone("task explorer app wrapper run", 1, "", [
			[ "machine id", env.machineId ], [ "session id", env.sessionId ], [ "app name", env.appName ],
			[ "remote name", env.remoteName ], [ "is new ap install", env.isNewAppInstall ]
		]);
		//
		// Signal that the startup work has completed
		//
		queueMicrotask(() => { this._ready = true; this._onReady.fire(); });
	};


	private registerContextMenuCommands = () =>
	{
		registerDonateCommand(this._context);
		registerAddToExcludesCommand(this._context);
		registerDisableTaskTypeCommand(this._context);
		registerEnableTaskTypeCommand(this._context);
		registerRemoveFromExcludesCommand(this._context);
	};


    private registerTaskProvider = (providerName: string, provider: TaskExplorerProvider) =>
    {
        this.context.subscriptions.push(tasks.registerTaskProvider(providerName, provider));
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

	get api() {
		return this._teApi;
	}

	get config(): IConfiguration {
		return this._configuration;
	}

	get context() {
		return this._context;
	}

	get debugging() {
		return this._context.extensionMode === ExtensionMode.Development;
	}

	set configwatcher(e: boolean) {
		enableConfigWatcher(e);
	}

	get env(): "dev" | "tests" | "production"
    {
		const isDev = this._context.extensionMode === ExtensionMode.Development,
			  isTests = this._context.extensionMode === ExtensionMode.Test;
		return !isDev && !isTests ? /* istanbul ignore next */"production" : (isDev ? "dev" : "tests");
	}

    get explorer() {
        return this.treeManager.views.taskExplorer?.tree;
    }

    set explorer(tree) {
		Object.assign(this._treeManager.views, { taskExplorer: { tree }});
    }

    get explorerView() {
        return this.treeManager.views.taskExplorer?.view;
    }

	get filecache() {
		return fileCache;
	}

	get fs() {
		return fs;
	}

	get id() {
		return this._context.extension.id;
	}

	get busy() {
		return this._busy || !this._ready || !this._initialized || fileCache.isBusy() || this._treeManager.isBusy() ||
			   isProcessingFsEvent() ||  isProcessingConfigChange() || this._licenseManager.isBusy();
	}

	get log() {
		return this._log;
	}

	get providers() {
		return this._providers;
	}

	get licenseManager() {
		return this._licenseManager;
	}

    get sidebar() {
        return this.treeManager.views.taskExplorerSideBar?.tree;
    }

    set sidebar(tree: TaskTree) {
		Object.assign(this._treeManager.views, { taskExplorerSideBar: { tree }});
    }

    get sidebarView() {
        return this.treeManager.views.taskExplorerSideBar?.view;
    }

	get treeManager() {
		return this._treeManager;
	}

	get taskManager() {
		return this._treeManager.taskManager;
	}

	get storage(): IStorage {
		return this._storage;
	}

	get usage(): UsageWatcher {
		return this._usage;
	}

	get version(): string {
		return this._version;
	}

	get homeView() {
		return this._homeView;
	}

	get taskCountView() {
		return this._taskCountView;
	}

	get taskUsageView() {
		return this._taskCountView;
	}

	get licensePage() {
		return this._licensePage;
	}

	get parsingReportPage() {
		return this._parsingReportPage;
	}

	get releaseNotesPage() {
		return this._releaseNotesPage;
	}

	get tests() {
		return this._tests || this._context.extensionMode === ExtensionMode.Test;
	}

	set tests(v) {
		this._tests = v;
	}

	get utils() {
		return utilities;
	}

	get wsfolder() {
		return (workspace.workspaceFolders as WorkspaceFolder[])[0];
	}

	// await window.withProgress(
	// {
	// 	location: ProgressLocation.Window,
	// 	cancellable: false,
	// 	title: "ExtJs"
	// },
	// async (progress) => _run(progress));

    // private updateProgress = async(action: string, pct: number) =>
    // {
    //     (this.progress as Progress<{ message: string }>).report({
    //         message: `: Parsing ${action} ${pct}%`
    //     });
    //     await utils.sleep(1); // let progress update
    // };

	// private _keyboard: Keyboard;
	// get keyboard() {
	// 	return this._keyboard;
	// }

	// get subscription() {
	// 	return this._subscription;
	// }

	// get subscriptionAuthentication() {
	// 	return this._subscriptionAuthentication;
	// }

	// get statusBar() {
	// 	return this._statusBarController;
	// }

	// get telemetry(): TelemetryService {
	// 	return this._telemetry;
	// }

	// get viewCommands() {
	// 	if (!this._viewCommands) {
	// 		this._viewCommands = new ViewCommands(this);
	// 	}
	// 	return this._viewCommands;
	// }

}

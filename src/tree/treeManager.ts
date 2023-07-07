
import { join } from "path";
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { getMd5 } from ":env/crypto";
import { TaskFolder } from "./folder";
import { TeTreeView } from "./treeView";
import { encodeUtf8Hex } from ":env/hex";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeBuilder } from "./treeBuilder";
import { FavoritesFolder } from "./favoritesFolder";
import { LastTasksFolder } from "./lastTasksFolder";
import { SpecialTaskFolder } from "./specialFolder";
import { TeTreeConfigWatcher } from "./configWatcher";
import { getTerminal } from "../lib/utils/getTerminal";
import { registerCommand } from "../lib/command/command";
import { addToExcludes } from "../lib/utils/addToExcludes";
import { isTaskIncluded } from "../lib/utils/isTaskIncluded";
import {
    IDictionary, ITeTreeManager, ITeTaskChangeEvent, ITeTask, ITaskTreeView, TaskMap
} from "../interface";
import {
    TreeItem, Uri, workspace, Task, tasks as vscTasks, Disposable, TreeItemCollapsibleState, EventEmitter, Event
} from "vscode";


export class TaskTreeManager implements ITeTreeManager, Disposable
{
    private _refreshPending = false;
    private _firstTreeBuildDone = false;
    private _npmScriptsHash: IDictionary<string>;
    private _currentInvalidation: string | undefined;

    private readonly _tasks: Task[];
    private readonly _disposables: Disposable[];
    private readonly _treeBuilder: TaskTreeBuilder;
	private readonly _configWatcher: TeTreeConfigWatcher;
    private readonly _onReady: EventEmitter<ITeTaskChangeEvent>;
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;
    private readonly _onDidTaskCountChange: EventEmitter<ITeTaskChangeEvent>;
    private readonly _views: { taskExplorer: TeTreeView; taskExplorerSideBar: TeTreeView };
    private readonly _specialFolders: { favorites: FavoritesFolder; lastTasks: LastTasksFolder };


    constructor(private readonly wrapper: TeWrapper)
    {
        this.wrapper.log.methodStart("treemgr: construct task tree manager", 1, "   ");

        this._tasks = [];
        this._npmScriptsHash = {};
        this._onReady = new EventEmitter<ITeTaskChangeEvent>();
        this._onDidTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this._onDidTaskCountChange = new EventEmitter<ITeTaskChangeEvent>();

        const nodeExpandedeMap = this.wrapper.config.get<IDictionary<"Collapsed"|"Expanded">>("specialFolders.folderState");
        this._specialFolders = {
            favorites: new FavoritesFolder(wrapper, TreeItemCollapsibleState[nodeExpandedeMap.favorites]),
            lastTasks: new LastTasksFolder(wrapper, TreeItemCollapsibleState[nodeExpandedeMap.lastTasks])
        };

        this._treeBuilder = new TaskTreeBuilder(wrapper);
		this._configWatcher = new TeTreeConfigWatcher(wrapper);

        this._views = {
            taskExplorer: new TeTreeView(wrapper, this, wrapper.extensionTitle, "", "taskTreeExplorer"),
            taskExplorerSideBar: new TeTreeView(wrapper, this, wrapper.extensionTitle, "", "taskTreeSideBar")
        };

        this._disposables = [
            this._onReady,
			this._configWatcher,
            this._onDidTasksChange,
            this._onDidTaskCountChange,
            this._specialFolders.favorites,
            this._specialFolders.lastTasks,
            this._views.taskExplorer,
            this._views.taskExplorerSideBar,
            registerCommand(wrapper.keys.Commands.AddToExcludes, this.addToExcludes, this),
            registerCommand(wrapper.keys.Commands.AddRemoveCustomLabel, this.addRemoveSpecialTaskLabel, this),
            registerCommand(wrapper.keys.Commands.OpenTerminal, this.openTerminal, this),
            registerCommand(wrapper.keys.Commands.Refresh, this.refresh, this)
        ];

        this.wrapper.log.methodDone("treemgr: construct task tree manager", 1, "   ");
    }

    dispose = () => { this._tasks.splice(0); this._disposables.splice(0).forEach(d => d.dispose()); };


    get taskMap(): TaskMap { return this._treeBuilder.taskMap; }

    get tasks(): Task[] { return this._tasks; }

    get taskFolders(): TaskFolder[] { return this._treeBuilder.taskFolders; }

	get configWatcher(): TeTreeConfigWatcher { return this._configWatcher; }

    get isBusy(): boolean { return this._refreshPending || this._configWatcher.isBusy; }

	get onDidAllTasksChange(): Event<ITeTaskChangeEvent> { return this._onDidTasksChange.event; }

    get onDidTaskCountChange(): Event<ITeTaskChangeEvent> { return this._onDidTaskCountChange.event; }

	get onDidFavoriteTasksChange(): Event<ITeTaskChangeEvent> { return this._specialFolders.favorites.onDidTasksChange; }

	get onDidLastTasksChange(): Event<ITeTaskChangeEvent> { return this._specialFolders.lastTasks.onDidTasksChange; }

    get onReady(): Event<ITeTaskChangeEvent> { return this._onReady.event; }

    get famousTasks(): ITeTask[] { return this.wrapper.usage.famousTasks; }

    get favoritesTasks(): Task[] { return this._specialFolders.favorites.taskFiles.map(f => f.task); }

    get lastTasks(): Task[] { return this._specialFolders.lastTasks.taskFiles.map(f => f.task); }

    get lastTasksFolder(): LastTasksFolder { return this._specialFolders.lastTasks; }

    get runningTasks(): Task[] { return vscTasks.taskExecutions.map(e => e.task); }

    get views(): { taskExplorer: ITaskTreeView; taskExplorerSideBar: ITaskTreeView } { return this._views; }


    private addRemoveSpecialTaskLabel = async (item: TaskItem): Promise<boolean> => (<SpecialTaskFolder>item.folder).addRemoveRenamedLabel(item);


    private addToExcludes = async (selection: TaskFile | TaskItem): Promise<void> =>
    {
        let uri: Uri | false,
            excludesList = "exclude";
        const pathValues: string[] = [];

        this.wrapper.log.methodStart("treemgr: add to excludes", 1, "", true, [[ "global", global ]]);

        if (selection instanceof TaskFile)
        {
            uri = selection.resourceUri;
            if (selection.isGroup)
            {
                this.wrapper.log.value("   adding file group", uri.path, 2);
                for (const each of selection.treeNodes)
                {
                    this.wrapper.log.value("      adding file path", each.resourceUri.path, 3);
                    pathValues.push(uri.path);
                }
            }
            else {
                this.wrapper.log.value("   adding file path", uri.path, 2);
                pathValues.push(uri.path);
            }
        }
        else // if (selection instanceof TaskItem)
        {
            uri = false;
            if (this.wrapper.taskUtils.isScriptType(selection.taskSource))
            {
                this.wrapper.log.value("   adding file path", selection.resourceUri.path, 2);
                pathValues.push(selection.resourceUri.path);
            }
            else {
                excludesList = "excludeTask";
                pathValues.push(selection.task.name);
            }
        }

        this._configWatcher.enableConfigWatcher(false);
        await addToExcludes(pathValues, excludesList, "   ");
        this._configWatcher.enableConfigWatcher(true);

        await this.refresh(selection.taskSource, uri, "   ");

        this.wrapper.log.methodDone("treemgr: add to excludes", 1);
    };


    private cleanFetchedTasks = (logPad: string): void =>
    {
        let ctRmv = 0;
        const tasksCache = this._tasks;
        this.wrapper.log.write("removing any ignored tasks from new fetch", 3, logPad);
        tasksCache.slice().reverse().forEach((item, index, object) => // niftiest loop ever
        {   //
            // Make sure this task shouldn't be ignored based on various criteria...
            // Process only if this task type/source is enabled in settings or is scope is empty (VSCode provided task)
            // By default, also ignore npm 'install' tasks, since its available in the context menu, ignore
            // other providers unless it has registered as an external provider via Task Explorer API.
            // Only internally provided tasks will be present in the this.tasks cache at this point, as extension
            // provided tasks will have been skipped/ignored in the provideTasks() processing.
            //
            if (!isTaskIncluded(this.wrapper, item, this.wrapper.pathUtils.getTaskRelativePath(item), logPad + "   "))
            {
                ++ctRmv;
                tasksCache.splice(object.length - 1 - index, 1);
                this.wrapper.log.value("   ignoring task", item.name, 3, logPad);
            }
        });
        this.wrapper.log.write(`ignored ${ctRmv} ${this._currentInvalidation} tasks from new fetch`, 3, logPad);
    };


    private doTaskCacheRemovals = (invalidation: string, logPad: string): void =>
    {
        let ctRmv = 0;
        this.wrapper.log.methodStart("treemgr: do task cache removals", 2, logPad);
        this._tasks.slice().reverse().forEach((item, index, object) => // niftiest loop ever
        {   //
            // Note that requesting a task type can return Workspace tasks (tasks.json/vscode)
            // if the script type set for the task in tasks.json is of type '_currentInvalidation'.
            // Remove any Workspace type tasks returned as well, in this case the source type is
            // != _currentInvalidation, but the definition type == _currentInvalidation
            //
            if (item.source === invalidation || (item.source === "Workspace" && item.definition.type === invalidation))
            {
                this._tasks.splice(object.length - 1 - index, 1);
                this.wrapper.log.write(`      removed task '${item.source}/${item.name}'`, 3, logPad);
                ++ctRmv;
            }
        });
        this.wrapper.log.write(`   removed ${ctRmv} ${invalidation} current tasks from cache`, 2, logPad);
        this.wrapper.log.methodDone("treemgr: do task cache removals", 2, logPad);
    };


    private fetchTasks = async(logPad: string): Promise<void> =>
    {
        let taskItems;
        const inv = this._currentInvalidation,
              zeroTasksToStart = this._tasks.length === 0;
        this.wrapper.log.methodStart("fetch tasks", 1, logPad);
        if (zeroTasksToStart || !inv)
        {
            this.wrapper.log.write("   fetching all tasks via VSCode fetchTasks call", 1, logPad);
            this.wrapper.statusBar.update("Requesting all tasks from all providers");
            taskItems = await vscTasks.fetchTasks();
            this._tasks.splice(0);
            this.wrapper.log.write(`   adding ${taskItems.length} tasks`, 2, logPad);
        }     //
        else // inv guaranteed to be a string (task type) here
        {   //
            const taskName = this.wrapper.taskUtils.getTaskTypeFriendlyName(inv);
            this.wrapper.log.write(`   fetching ${taskName} tasks via VSCode fetchTasks call`, 1, logPad);
            this.wrapper.statusBar.update("Requesting  tasks from " + taskName + " task provider");
            //
            // Request all tasks of type 'this._currentInvalidation'.  Workspace type tasks can be of
            // any task type, so in case of Ws task invalidation, request all tasks from all providers
            //
            if (inv === "Workspace") {
                taskItems = (await vscTasks.fetchTasks()).filter(t => t.source === inv);
            }
            else {
                taskItems = await vscTasks.fetchTasks({ type: inv !== "tsc" ? inv : "typescript" });
            }
            //
            // Process the tasks cache array for any removals that might need to be made, e.g. remove
            // tasks that already existed that were just re-parsed
            //
            this.doTaskCacheRemovals(inv, logPad);
            this.wrapper.log.write(`   adding ${taskItems.length} new ${inv} tasks`, 2, logPad);
        }
        //
        // Cache the requested tasks
        //
        this._tasks.push(...taskItems);
        //
        // Check the finalized task cache array for any ignores that still need to be processed,
        // e.g. 'grunt' or 'gulp' tasks that are internally provided by VSCode and we have no
        // control over the provider returning them.  Internally provided Grunt and Gulp tasks
        // are differentiable from TE provided Gulp and Grunt tasks in that the VSCode provided
        // tasks do no not have task.definition.uri set.
        //
        this.cleanFetchedTasks(logPad + "   ");
        //
        // Hash NPM script blocks, to ignore edits to package.json when scripts have not changed, since
        // we have to query the entire workspace for npm tasks to get changes.  TODO is srtill to write
        // an internal NPM task provider like I did for Grunt and Gulp.
        //
        if (zeroTasksToStart || !inv || inv === "npm") {
            this.hashNpmScripts();
        }
        //
        // Check License Manager for any task count restrictions
        //
        const licMgr = this.wrapper.licenseManager,
              maxTasks = licMgr.getMaxNumberOfTasks();
        if (this._tasks.length > maxTasks)
        {
            let ctRmv = 0;
            ctRmv = this._tasks.length - maxTasks;
            this.wrapper.log.write(`      removing ${ctRmv} tasks, max count reached (no license)`, 3, logPad);
            this._tasks.splice(maxTasks, ctRmv);
            licMgr.setMaxTasksReached();
        }
        this.wrapper.log.methodDone("fetch tasks", 1, logPad);
    };


    private fireTasksLoadedEvents = (prevTaskCount: number): void =>
    {
        const iTasks = this.wrapper.taskUtils.toITask(this.wrapper, this._tasks, "all");
        this._onDidTasksChange.fire({ tasks: iTasks, type: "all" });
        if (this._tasks.length !== prevTaskCount) {
            this._onDidTaskCountChange.fire({ tasks: iTasks, type: "all" });
        }
        if (!this._firstTreeBuildDone) {
            this._onReady.fire({ tasks: iTasks, type: "all" });
        }
    };


    fireTreeRefreshEvent = (treeItem: TreeItem | null, taskItem: TaskItem | null, logPad: string): void =>
    {
        Object.values(this._views).filter(v => v.enabled).forEach((v) =>
        {
            v.tree.fireTreeRefreshEvent(treeItem, logPad);
            if (treeItem && taskItem)
            {
                Object.values(this._specialFolders).filter(f => f.hasTask(taskItem)).forEach((f) =>
                {
                    v.tree.fireTreeRefreshEvent(f, logPad);
                });
            }
        });
    };


    getMessage = (): string | undefined => Object.values(this._views).find(v => v.enabled && v.visible)?.view.message;


    getTaskItem =  (taskItem: TaskItem | ITeTask | Uri): TaskItem => this._treeBuilder.toTaskItem(taskItem);


    private handleRebuildEvent = async(invalidate: string | undefined, opt: Uri | false | undefined, logPad: string): Promise<void> =>
    {   //
        // The file cache only needs to update once on any change, since this will get called through
        // twice if both the Explorer and Sidebar Views are enabled, do a lil check here to make sure
        // we don't double scan for nothing.
        //
        this.wrapper.log.methodStart("treemgr: handle tree rebuild event", 1, logPad);
        if (invalidate === undefined && opt === undefined) // i.e. refresh button was clicked
        {
            this.wrapper.log.write("   handling 'rebuild cache' event", 1, logPad + "   ");
            await this.wrapper.fileCache.rebuildCache(logPad + "   ");
            this.wrapper.log.write("   handling 'rebuild cache' event complete", 1, logPad + "   ");
        }
        this.wrapper.log.write("   handling 'invalidate tasks cache' event", 1, logPad);
        await this.invalidateTasksCache(invalidate, opt, logPad + "   ");
        this.wrapper.log.methodDone("treemgr: handle tree rebuild event", 1, logPad);
    };


    private hashKey = (key: string) => encodeUtf8Hex(key);


    private hashKeyValue = (value: string) => getMd5(value, "base64");


    private hashNpmScripts = (): void =>
    {
        const w = this.wrapper;
        this._npmScriptsHash = {};
        this._tasks.filter(t => t.source === "npm" && t.definition.type === "npm" && w.typeUtils.isWorkspaceFolder(t.scope)).forEach((t) =>
        {
            const fsPath = join(w.pathUtils.getTaskAbsolutePath(t), "package.json"),
                  npmPkgJso = w.fs.readJsonSync<any>(fsPath),
                  scriptsBlock = npmPkgJso.scripts,
                  scriptsJson = JSON.stringify(scriptsBlock),
                  hashKey = this.hashKey(fsPath),
                  scriptsChecksum = this.hashKeyValue(scriptsJson);
            this._npmScriptsHash[hashKey] = scriptsChecksum;
        });
    };


    private loadTasks = async(doFetch: boolean, logPad: string): Promise<void> =>
    {
        const count = this._tasks.length,
              firstTreeBuildDone = this._firstTreeBuildDone;
        this._refreshPending = true;
        this.setMessage(!firstTreeBuildDone ? this.wrapper.keys.Strings.RequestingTasks : undefined);
        try
        {   if (doFetch)
            {
                await this.fetchTasks(logPad);
                if (!firstTreeBuildDone) {
                    this.setMessage(this.wrapper.keys.Strings.BuildingTaskTree);
                }
                await this._treeBuilder.createTaskItemTree(true /* count > this._tasks.length*/, logPad + "   ");
                Object.values(this._specialFolders).forEach(f => f.build(logPad + "   "));
                await this.setContext();
            }
        }
        finally {
            this.setMessage(this._tasks.length > 0 ? undefined : this.wrapper.keys.Strings.NoTasks);
            this.fireTreeRefreshEvent(null, null, logPad);
            this.fireTasksLoadedEvents(count);
            this._refreshPending = false;
        }
    };


    /**
     * This function should only be called by the unit tests
     *
     * All internal task providers export an invalidate() function...
     *
     * If 'opt1' is a string then a filesystemwatcher, settings change, or taskevent was
     * triggered for the task type defined in the 'opt1' parameter.
     *
     * The 'opt1' parameter may also have a value of 'tests', which indicates this is
     * being called from the unit tests, so some special handling is required.
     *
     * In the case of a settings change, 'opt2' will be undefined.  Depending on how many task
     * types configs' were altered in settings, this function may run through more than once
     * right now for each task type affected.  Some settings require a global refresh, for example
     * the 'groupDashed' settings, or 'enableSideBar',etc.  If a global refresh is to be performed,
     * then both 'opt1' and 'opt2' will be undefined.
     *
     * In the cases of a task event, 'opt2' is undefined.
     *
     * If a FileSystemWatcher event, then 'opt2' should contain the Uri of the file that was
     * modified, created, or deleted.
     *
     *
     * @param opt1 Task provider type.  Can be one of:
     *     "ant"
     *     "apppublisher"
     *     "bash"
     *     "batch"
     *     "composer"
     *     "gradle"
     *     "grunt"
     *     "gulp"
     *     "jenkins"
     *     "make"
     *     "npm"
     *     "nsis"
     *     "perl"
     *     "pipenv"
     *     "powershell"
     *     "python"
     *     "ruby"
     *     "webpack"
     *     "Workspace"
     * @param opt2 The uri of the file that contains/owns the task
     */
    private invalidateTasksCache = async(opt1?: string, opt2?: Uri | boolean, logPad?: string) =>
    {
        const w = this.wrapper;
        w.log.methodStart("invalidate tasks cache", 1, logPad, false, [
            [ "opt1", opt1 ], [ "opt2", opt2 && opt2 instanceof Uri ? opt2.fsPath : opt2 ]
        ]);
        await this.wrapper.utils.wrap(async (o1, o2) =>
        {
            if (o1 && o2 instanceof Uri)
            {
                w.log.write("   invalidate '" + o1 + "' task provider file ", 1, logPad);
                w.log.value("      file", o2.fsPath, 1, logPad);
                await w.providers[o1]?.invalidate(o2, logPad + "   ");
            }     //
            else // If o1 is undefined refresh all providers
            {   //
                if (!o1)
                {
                    w.log.write("   invalidate all providers", 1, logPad);
                    for (const [ key, p ] of Object.entries(w.providers))
                    {
                        w.log.write("   invalidate '" + key + "' task provider", 1, logPad);
                        await p.invalidate(undefined, logPad + "   ");
                    }
                }
                else { // NPM(optional)/Workspace/TSC tasks don't implement TaskExplorerProvider
                    w.log.write("   invalidate '" + o1 + "' task provider", 1, logPad);
                    w.providers[o1]?.invalidate(undefined, logPad + "   ");
                }
            }
        }, [ w.log.error ], this, opt1, opt2);
        w.log.methodDone("invalidate tasks cache", 1, logPad);
    };


    private onWorkspaceFolderRemoved = async (uri: Uri, logPad: string): Promise<void> =>
    {
        const w = this.wrapper,
              tasks = this._tasks,
              taskMap = this._treeBuilder.taskMap,
              taskFolders = this._treeBuilder.taskFolders;

        w.log.methodStart("treemgr: workspace folder removed event", 1, logPad, false, [[ "path", uri.fsPath ]]);
        w.log.write("   removing project tasks from cache", 1, logPad);
        w.log.values(1, logPad + "   ", [
            [ "current # of tasks", tasks.length ], [ "current # of tree folders", taskFolders.length ],
            [ "project path removed", uri.fsPath ]
        ]);
        w.statusBar.update("Deleting all tasks from removed project folder");

        const removed = this.wrapper.utils.popIfExistsBy(tasks,
            (t) => t.definition.uri && t.definition.uri.fsPath.startsWith(uri.fsPath),
            this
        );

        this.wrapper.utils.popObjIfExistsBy(taskMap,
            (_k, i) => !!i && (i.resourceUri?.fsPath.startsWith(uri.fsPath) || i.taskFile.resourceUri.fsPath.startsWith(uri.fsPath)),
            this
        );

        this.wrapper.utils.popIfExistsBy(taskFolders, f => f.resourceUri?.fsPath === uri.fsPath, this, true);

        w.log.write(`   removed ${removed.length} tasks from task cache`, 1, logPad);
        w.log.values(1, logPad + "   ", [
            [ "new # of tasks", tasks.length ], [ "new # of tree folders", taskFolders.length ]
        ]);

        w.statusBar.update("");
        this._refreshPending = false;
        this.fireTreeRefreshEvent(null, null, logPad + "   ");
        w.log.methodDone("treemgr: workspace folder removed event", 1, logPad);
    };


    private openTerminal = (item: TaskItem | ITeTask): void => { getTerminal(this.getTaskItem(item))?.show(); };


    /**
     * Responsible for refreshing the tree content and tasks cache
     * This function is called each time and event occurs, whether its a modified or new
     * file (via FileSystemWatcher event), or when the view first becomes active/visible, etc.
     *
     * @param invalidate The invalidation event.
     * Can be one of the custom values:
     *     false
     *     null
     *     undefined
     *
     * Or one of the task types (from FileSystemWatcher event):
     *
     *     "ant"
     *     "apppublisher"
     *     "bash"
     *     "batch"
     *     "composer"
     *     "gradle"
     *     "grunt"
     *     "gulp"
     *     "jenkins"
     *     "make"
     *     "npm"
     *     "nsis"
     *     "perl"
     *     "pipenv"
     *     "powershell"
     *     "python"
     *     "ruby"
     *     "webpack"
     *     "Workspace"
     *
     * If invalidate is false, then this is both an event as a result from adding to excludes list
     * and the item being added is a file, not a group / set of files.  If the item being added to
     * the excludes list is a group/folder, then invalidate will be set to the task source, i.e.
     * npm, ant, workspace, etc.
     *
     * If invalidate is true and opt is false, then the refresh button was clicked i.e. the 'refresh'
     * registered VSCode command was received
     *
     * If invalidate is a string and opt is a Uri, then a filesystemwatcher event or a task just triggered
     *
     * If invalidate and opt are both undefined, then a configuration has changed
     *
     * invalidate can be false when a grouping setting shas changed, where the tree needs to be rebuilt
     * but the file cache does not need to rebuild and  do not need to invalidate any task providers
     *
     * @param opt Uri of the invalidated resource
     */
    refresh = async(invalidate: string | false | undefined, opt: Uri | false | undefined, logPad: string): Promise<void> =>
    {
        const w = this.wrapper,
              isOptUri = w.typeUtils.isUri(opt);

        await this.waitForRefreshComplete();
        this._refreshPending = true;

        w.log.methodStart("treemgr: refresh task tree", 1, logPad, logPad === "", [
            [ "invalidate", invalidate ], [ "opt fsPath", isOptUri ? opt.fsPath : "n/a" ]
        ]);

        if (!this._firstTreeBuildDone)
        {
            await this.loadTasks(true, logPad + "   ");
            this._firstTreeBuildDone = true;
        }
        else if (isOptUri && w.fs.isDirectory(opt.fsPath) && !workspace.getWorkspaceFolder(opt))
        {   //
            // A workspace folder was removed.  We know it's a workspace folder because isDirectory()
            // returned true and getWorkspaceFolder() returned false.  If it was a regular directory
            // getting deleted from within a ws folder, then isDirectory() will not return true due
            // to no existing dir anymore to stat.  The getWorkspaceFolder() would also return a valid
            // ws project folder if it was just a dir delete or a dir add, or a ws folder add.  We
            // break out this case with a different handler since we can improve the performance pretty
            // significantly for this specific event.
            //
            await this.onWorkspaceFolderRemoved(opt, logPad);
        }
        // else if (w.utils.isString(invalidate, true) && w.utils.isUri(opt))
        // {
        //     // TODO = Performance enhancement.  Handle a file deletejust like we do a workspace folder
        //     //        delete above.  And we can avoid the task refresh/fetch and tree rebuild.
        // }  //
        else //
        {   //
            // Check for an NPM / package.json file change/add event.
            // We track the scripts block so we don't have to re-fetch NPM tasks when a package.json is
            // modified, but it's scripts have not.  Not really a thing when user is using internal npm
            // provider, but the VSCode npm task provider is slower than a turtle's s*** so this was a
            // nice little performance increase.
            //
            // TODO - Can remove the pathExistsSync check when the TODO item above (handle delete events)
            //        has been implemented.
            //
            let doFetch = true;
            if (isOptUri && invalidate === "npm" && w.fs.pathExistsSync(opt.fsPath))
            {   //
                // Often, package.json files are modified but a lot of times not the `scripts` object,
                // so we track package.json mods and only process if the `scripts` object has been modified.
                // all other modifications outside of the `scripts` object are ignored.
                //
                w.log.write("   invalidation is for type 'npm', check hashed scripts object", 1, logPad);
                const npmPkgJso = w.fs.readJsonSync<any>(opt.fsPath),
                      scriptsJso = npmPkgJso.scripts || {},
                      scriptsJson = JSON.stringify(scriptsJso),
                      scriptsChecksum = this.hashKeyValue(scriptsJson),
                      hashKey = this.hashKey(opt.fsPath);
                doFetch = scriptsChecksum !== this._npmScriptsHash[hashKey];
                this._npmScriptsHash[hashKey] = scriptsChecksum;
            }
            //
            // Fetch tasks from VSCode.  The type of fetch is dependent upon the function parameters that
            // the cause event called in with. We don;t fetch tasks if any of the checks above has un-set
            // the `doFetch` flag.
            //
            if (doFetch)
            {
                if (invalidate !== false) {
                    await this.handleRebuildEvent(invalidate, opt, logPad + "   ");
                }
                if (opt !== false && w.typeUtils.isString(invalidate, true))
                {   //
                    // Re-fetch specific task type, specified by the `invalidate` parameter when `opt` is
                    // not `false`.  If we are here, a filesystem event has triggered i.e. create/mod/delete
                    //
                    w.log.write(`   invalidation is for type '${invalidate}'`, 1, logPad);
                    this._currentInvalidation = invalidate;
                }
                else if (invalidate === false && opt === undefined)
                {   //
                    // Rebuild tree only, tasks have not changed.  If we are here, then a grouping setting
                    // has changed, or the sort method, etc...
                    //
                    w.log.write("   no invalidation, rebuild tree only", 1, logPad);
                    await this._treeBuilder.createTaskItemTree(true, logPad + "   ");
                    doFetch = false;
                }     //
                else // Re-fetch all tasks from all providers, and rebuild tree
                {   //
                    w.log.write("   invalidation is for all types", 1, logPad);
                    this._currentInvalidation = undefined;
                }
            } //
             // Fetch specified tasks.  If `doFetch` is false, then this call will only fire the completion
            // events and reset completion flags.
            //
            await this.loadTasks(doFetch, logPad + "   ");
        }

        w.log.methodDone("treemgr: refresh task tree", 1, logPad);
    };


    private setContext = async (): Promise<void> =>
    {
        const taskTypeProcessed: string[] = [],
              scriptFilesWithArgs: string[] = [],
              taskMap = Object.values(this._treeBuilder.taskMap).filter(i => !!i);
        for (const taskItem of taskMap)
        {
            const task = taskItem.task;
            if (task.definition.takesArgs && taskItem.resourceUri) {
                scriptFilesWithArgs.push(taskItem.resourceUri.fsPath);
            }
            this.wrapper.utils.pushIfNotExists(taskTypeProcessed, task.source);
        }
        scriptFilesWithArgs.sort();
        await this.wrapper.contextTe.setContext(`${this.wrapper.keys.Context.TasksPrefix}scriptFilesWithArgs`, scriptFilesWithArgs);
    };


    setMessage = (m?: string): void => Object.values(this._views).filter(v => v.enabled && v.visible).forEach(v => { v.view.message =  m; });


    private waitForRefreshComplete = async (maxWait = 15000): Promise<void> =>
    {
        let waited = 0;
        while (this._refreshPending && waited < maxWait) {
            await this.wrapper.utils.sleep(50);
            waited += 50;
        }
    };

}

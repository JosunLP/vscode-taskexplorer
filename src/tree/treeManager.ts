
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeTreeView } from "./treeView";
import { Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { ContextKeys } from "../lib/context";
import { TaskTreeBuilder } from "./treeBuilder";
import { FavoritesFolder } from "./favoritesFolder";
import { LastTasksFolder } from "./lastTasksFolder";
import { TeTreeConfigWatcher } from "./configWatcher";
import { getTerminal } from "../lib/utils/getTerminal";
import { addToExcludes } from "../lib/utils/addToExcludes";
import { isTaskIncluded } from "../lib/utils/isTaskIncluded";
import { Commands, registerCommand } from "../lib/command/command";
import { IDictionary, ITeTreeManager, ITeTaskChangeEvent, ITeTask, ITaskDefinition, ITaskTreeView } from "../interface";
import { TreeItem, Uri, workspace, Task, tasks, Disposable, TreeItemCollapsibleState, EventEmitter, Event } from "vscode";
import { SpecialTaskFolder } from "./specialFolder";


export class TaskTreeManager implements ITeTreeManager, Disposable
{
    private _tasks: Task[] = [];
    private refreshPending = false;
    private _treeBuilder: TaskTreeBuilder;
    private firstTreeBuildDone = false;
    private currentInvalidation: string | undefined;
    private readonly disposables: Disposable[] = [];
	private readonly _configWatcher: TeTreeConfigWatcher;
    private readonly _onReady: EventEmitter<ITeTaskChangeEvent>;
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;
    private readonly _onDidTaskCountChange: EventEmitter<ITeTaskChangeEvent>;
    private readonly _views: { taskExplorer: TeTreeView; taskExplorerSideBar: TeTreeView };
    private readonly _specialFolders: { favorites: FavoritesFolder; lastTasks: LastTasksFolder };


    constructor(private readonly wrapper: TeWrapper)
    {
        this.wrapper.log.methodStart("treemgr: construct task tree manager", 1, "   ");

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
            taskExplorer: new TeTreeView(wrapper, this, wrapper.extensionName, "", "taskTreeExplorer", "taskexplorer:treeView:taskTreeExplorer"),
            taskExplorerSideBar: new TeTreeView(wrapper, this, wrapper.extensionName, "", "taskTreeSideBar", "taskexplorer:treeView:taskTreeSideBar")
        };

        this.disposables.push(
            this._onReady,
			this._configWatcher,
            this._onDidTasksChange,
            this._onDidTaskCountChange,
            this._specialFolders.favorites,
            this._specialFolders.lastTasks,
            this._views.taskExplorer,
            this._views.taskExplorerSideBar,
            registerCommand(Commands.AddToExcludes, (item: TaskFile | TaskItem) => this.addToExcludes(item), this),
            registerCommand(Commands.AddRemoveCustomLabel, (item: TaskItem) => this.addRemoveSpecialTaskLabel(item), this),
            registerCommand(Commands.OpenTerminal, (item: TaskItem | ITeTask) => this.openTerminal(this.getTaskItem(item)), this),
            registerCommand(Commands.Refresh, (taskType?: string | false | undefined, uri?: Uri | false | undefined, logPad = "") => this.refresh(taskType, uri, logPad), this)
        );

        this.wrapper.log.methodDone("treemgr: construct task tree manager", 1, "   ");
    }

    dispose()
    {
        this.disposables.forEach(d => d.dispose());
        this.disposables.splice(0);
        this._tasks = [];
    }


	get configWatcher(): TeTreeConfigWatcher {
		return this._configWatcher;
	}

    get isBusy(): boolean {
        return this.refreshPending || this._configWatcher.isBusy;
            // this.views.taskExplorer.tree.isBusy() || this.views.taskExplorerSideBar.tree.isBusy() ||
            // this.refreshPending || this._treeBuilder.isBusy();
    }

	get onDidAllTasksChange(): Event<ITeTaskChangeEvent> {
		return this._onDidTasksChange.event;
	}

    get onDidTaskCountChange(): Event<ITeTaskChangeEvent> {
		return this._onDidTaskCountChange.event;
	}

	get onDidFavoriteTasksChange(): Event<ITeTaskChangeEvent> {
		return this._specialFolders.favorites.onDidTasksChange;
	}

	get onDidLastTasksChange(): Event<ITeTaskChangeEvent> {
		return this._specialFolders.lastTasks.onDidTasksChange;
	}

    get onReady(): Event<ITeTaskChangeEvent> {
        return this._onReady.event;
    }

    get famousTasks(): ITeTask[] {
        return this.wrapper.usage.famousTasks;
    }

    get favoritesTasks(): Task[] {
        return this._specialFolders.favorites.taskFiles.map(f => f.task);
    }

    get lastTasks(): Task[] {
        return this._specialFolders.lastTasks.taskFiles.map(f => f.task);
    }

    get lastTasksFolder(): LastTasksFolder {
        return this._specialFolders.lastTasks;
    }

    get runningTasks(): Task[] {
        return tasks.taskExecutions.map(e => e.task);
    }

    get views(): { taskExplorer: ITaskTreeView; taskExplorerSideBar: ITaskTreeView } {
        return this._views;
    }


    private addRemoveSpecialTaskLabel = async(item: TaskItem) => (<SpecialTaskFolder>item.folder).addRemoveRenamedLabel(item);


    private addToExcludes = async(selection: TaskFile | TaskItem) =>
    {
        let uri: Uri | false;
        let excludesList = "exclude";
        const pathValues: string[] = [];

        this.wrapper.log.methodStart("treemgr: add to excludes", 1, "", true, [[ "global", global ]]);

        if (selection instanceof TaskFile)
        {
            uri = selection.resourceUri;
            if (selection.isGroup)
            {
                this.wrapper.log.value("   adding file group", uri.path, 2);
                for (const each of selection.treeNodes.filter(n => !!n.resourceUri))
                {
                    const  uri = each.resourceUri as Uri;
                    this.wrapper.log.value("      adding file path", uri.path, 3);
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
                const resourceUri = selection.resourceUri as Uri;
                this.wrapper.log.value("   adding file path", resourceUri.path, 2);
                pathValues.push(resourceUri.path);
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


    private cleanFetchedTasks = (logPad: string) =>
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
        this.wrapper.log.write(`ignored ${ctRmv} ${this.currentInvalidation} tasks from new fetch`, 3, logPad);
    };


    private doTaskCacheRemovals = (invalidation: string | undefined, logPad: string) =>
    {
        let ctRmv = 0;
        this.wrapper.log.methodStart("treemgr: do task cache removals", 2, logPad);
        const showUserTasks = this.wrapper.config.get<boolean>("specialFolders.showUserTasks");
        this._tasks.slice().reverse().forEach((item, index, object) => // niftiest loop ever
        {   //
            // Note that requesting a task type can return Workspace tasks (tasks.json/vscode)
            // if the script type set for the task in tasks.json is of type 'currentInvalidation'.
            // Remove any Workspace type tasks returned as well, in this case the source type is
            // != currentInvalidation, but the definition type == currentInvalidation
            //
            if (invalidation && item.source === invalidation || item.source === "Workspace")
            {
                if (item.source !== "Workspace" || item.definition.type === invalidation)
                {
                    this._tasks.splice(object.length - 1 - index, 1);
                    this.wrapper.log.write(`      removed task '${item.source}/${item.name}'`, 3, logPad);
                    ++ctRmv;
                }
            }
            //
            // Remove User tasks if they're not enabled
            //
            if (!showUserTasks && item.source === "Workspace" && !this.wrapper.typeUtils.isWorkspaceFolder(item.scope))
            {
                this._tasks.splice(object.length - 1 - index, 1);
            }
        });
        this.wrapper.log.write(`   removed ${ctRmv} ${invalidation} current tasks from cache`, 2, logPad);
        this.wrapper.log.methodDone("treemgr: do task cache removals", 2, logPad);
    };


    private fetchTasks = async(logPad: string) =>
    {
        this.wrapper.log.methodStart("fetch tasks", 1, logPad);
        if (this._tasks.length === 0 || !this.currentInvalidation || this.currentInvalidation  === "Workspace" || this.currentInvalidation === "tsc")
        {
            this.wrapper.log.write("   fetching all tasks via VSCode fetchTasks call", 1, logPad);
            await this.wrapper.statusBar.update("Requesting all tasks from all providers");
            this._tasks = await tasks.fetchTasks();
            //
            // Process the tasks cache array for any removals that might need to be made
            //
            this.doTaskCacheRemovals(undefined, logPad + "   "); // removes user tasks
        }     //
        else // this.currentInvalidation guaranteed to be a string (task type) here
        {   //
            const taskName = this.wrapper.taskUtils.getTaskTypeFriendlyName(this.currentInvalidation);
            this.wrapper.log.write(`   fetching ${taskName} tasks via VSCode fetchTasks call`, 1, logPad);
            await this.wrapper.statusBar.update("Requesting  tasks from " + taskName + " task provider");
            //
            // Get all tasks of the type defined in 'currentInvalidation' from VSCode, remove
            // all tasks of the type defined in 'currentInvalidation' from the tasks list cache,
            // and add the new tasks from VSCode into the tasks list.
            //
            const taskItems = await tasks.fetchTasks({ type: this.currentInvalidation });
            //
            // Process the tasks cache array for any removals that might need to be made
            //                                                          // removes tasks that already existed that were just re-parsed
            this.doTaskCacheRemovals(this.currentInvalidation, logPad); // of the same task type (this.currentInvalidation)
            this.wrapper.log.write(`   adding ${taskItems.length} new ${this.currentInvalidation} tasks`, 2, logPad);
            this._tasks.push(...taskItems);
        }
        //
        // Check the finalized task cache array for any ignores that still need to be processed,
        // e.g. 'grunt' or 'gulp' tasks that are internally provided by VSCode and we have no
        // control over the provider returning them.  Internally provided Grunt and Gulp tasks
        // are differentiable from TE provided Gulp and Grunt tasks in that the VSCode provided
        // tasks do no not have task.definition.uri set.
        //                                      //
        this.cleanFetchedTasks(logPad + "   "); // good byte shitty ass Grunt and Gulp providers, whoever
                                                // coded you should hang it up and retire, what a damn joke.

        if (!this.firstTreeBuildDone) {
            this.setMessage(Strings.BuildingTaskTree);
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
        //
        // Create/build the ui task tree
        //
        await this._treeBuilder.createTaskItemTree(logPad + "   ", 2);
        //
        // Build special folders (Last Tasks / Favorites, etc...)
        //
        Object.values(this._specialFolders).forEach(f => f.build(logPad + "   "));
        //
        // Set relevant context keys
        //
        await this.setContext();
        //
        // Done!
        //
        this.wrapper.log.methodDone("fetch tasks", 1, logPad);
    };


    fireTreeRefreshEvent = (treeItem: TreeItem | null, taskItem: TaskItem | null, logPad: string) =>
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


    getTaskItem =  (taskItem: TaskItem | ITeTask | Uri) =>
    {
        if (taskItem instanceof Uri) // FileExplorer Context menu
        {
            taskItem = Object.values(this.wrapper.treeManager.getTaskMap()).find(
                i =>  i && i.resourceUri && i.resourceUri.fsPath === (<Uri>taskItem).fsPath
            ) as TaskItem;
            void this.wrapper.treeManager.views.taskExplorer.view.reveal(taskItem, { select: false });
        }
        else if (!(taskItem instanceof TaskItem)) // ITeTask (Webview app)
        {
            taskItem = this.wrapper.treeManager.getTaskMap()[taskItem.definition.taskItemId as string] as TaskItem;
        }
        return taskItem;
    };


    getTaskMap = () => this._treeBuilder.getTaskMap();


    getTasks = () => this._tasks;


    getTaskTree = () => this._treeBuilder.getTaskTree();


    private handleRebuildEvent = async(invalidate: string | undefined, opt: Uri | false | undefined, logPad: string) =>
    {   //
        // The file cache only needs to update once on any change, since this will get called through
        // twice if both the Explorer and Sidebar Views are enabled, do a lil check here to make sure
        // we don't double scan for nothing.
        //
        this.wrapper.log.methodStart("treemgr: handle tree rebuild event", 1, logPad);
        if (invalidate === undefined && opt === undefined) // i.e. refresh button was clicked
        {
            this.wrapper.log.write("   handling 'rebuild cache' event", 1, logPad + "   ");
            this.setMessage(Strings.ScanningTaskFiles);
            await this.wrapper.fileCache.rebuildCache(logPad + "   ");
            this.wrapper.log.write("   handling 'rebuild cache' event complete", 1, logPad + "   ");
        }
        this.wrapper.log.write("   handling 'invalidate tasks cache' event", 1, logPad);
        await this.invalidateTasksCache(invalidate, opt, logPad + "   ");
        this.wrapper.log.methodDone("treemgr: handle tree rebuild event", 1, logPad);
    };


    loadTasks = async(logPad: string) =>
    {
        const count = this._tasks.length;
        this.wrapper.log.methodStart("treemgr: load tasks", 1, logPad);
        this.refreshPending = true;
        this._treeBuilder.invalidate();
        this.setMessage(Strings.RequestingTasks);
        await this.fetchTasks(logPad + "   ");
        this.setMessage();
        this.fireTreeRefreshEvent(null, null, logPad + "   ");
        //
        // Signal that the task list / tree has changed and set flags
        //
        this.refreshPending = false;
        const iTasks = this.wrapper.taskUtils.toITask(this.wrapper, this._tasks, "all");
        this._onDidTasksChange.fire({ tasks: iTasks, type: "all" });
        if (this._tasks.length !== count) {
            this._onDidTaskCountChange.fire({ tasks: iTasks, type: "all" });
        }
        if (!this.firstTreeBuildDone) {
            this._onReady.fire({ tasks: iTasks, type: "all" });
        }
        this.firstTreeBuildDone = true;
        this.wrapper.log.methodDone("treemgr: load tasks", 1, logPad);
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
        this.wrapper.log.methodStart("invalidate tasks cache", 1, logPad, false, [
            [ "opt1", opt1 ], [ "opt2", opt2 && opt2 instanceof Uri ? opt2.fsPath : opt2 ]
        ]);

        try {
            if (opt1 && opt2 instanceof Uri)
            {
                this.wrapper.log.write("   invalidate '" + opt1 + "' task provider file ", 1, logPad);
                this.wrapper.log.value("      file", opt2.fsPath, 1, logPad);
                // NPM/Workspace/TSC tasks don't implement TaskExplorerProvider
                await this.wrapper.providers[opt1]?.invalidate(opt2, logPad + "   ");
            }
            else //
            {   // If opt1 is undefined, refresh all providers
                //
                if (!opt1)
                {
                    this.wrapper.log.write("   invalidate all providers", 1, logPad);
                    for (const [ key, p ] of Object.entries(this.wrapper.providers))
                    {
                        this.wrapper.log.write("   invalidate '" + key + "' task provider", 1, logPad);
                        await p.invalidate(undefined, logPad + "   ");
                    }
                }
                else { // NPM/Workspace/TSC tasks don't implement TaskExplorerProvider
                    this.wrapper.log.write("   invalidate '" + opt1 + "' task provider", 1, logPad);
                    this.wrapper.providers[opt1]?.invalidate(undefined, logPad + "   ");
                }
            }
        }
        catch (e: any) {
            /* istanbul ignore next */
            this.wrapper.log.error([ "Error invalidating task cache", e ]);
        }

        this.wrapper.log.methodDone("invalidate tasks cache", 1, logPad);
    };


    private onWorkspaceFolderRemoved = async (uri: Uri, logPad: string) =>
    {
        this.wrapper.log.methodStart("treemgr: workspace folder removed event", 1, logPad, false, [[ "path", uri.fsPath ]]);
        let ctRmv = 0;
        const tasks = this._tasks,
                taskMap = this._treeBuilder.getTaskMap(),
                taskTree = this._treeBuilder.getTaskTree() as TaskFolder[];

        this.wrapper.log.write("   removing project tasks from cache", 1, logPad);
        this.wrapper.log.values(1, logPad + "      ", [
            [ "current # of tasks", tasks.length ], [ "current # of tree folders", taskTree.length ],
            [ "project path removed", uri.fsPath ]
        ]);
        await this.wrapper.statusBar.update("Deleting all tasks from removed project folder");
        tasks.reverse().forEach((item, index, object) =>
        {
            if (item.definition.uri && item.definition.uri.fsPath.startsWith(uri.fsPath))
            {
                this.wrapper.log.write(`      removing task '${item.source}/${item.name}' from task cache`, 2, logPad);
                tasks.splice(object.length - 1 - index, 1);
                ++ctRmv;
            }
        });
        for (const tId of Object.keys(taskMap))
        {
            const item = taskMap[tId] as TaskItem;
            if  (item.resourceUri?.fsPath.startsWith(uri.fsPath) || item.taskFile.resourceUri.fsPath.startsWith(uri.fsPath))
            {
                delete taskMap[tId];
            }
        }
        const folderIdx = taskTree.findIndex((f: TaskFolder) => f.resourceUri?.fsPath === uri.fsPath);
        taskTree.splice(folderIdx, 1);
        this.wrapper.log.write(`      removed ${ctRmv} tasks from task cache`, 1, logPad);
        this.wrapper.log.values(1, logPad + "      ", [
            [ "new # of tasks", tasks.length ], [ "new # of tree folders", taskTree.length ]
        ]);
        this.refreshPending = false;
        await this.wrapper.statusBar.update("");
        this.wrapper.log.write("   fire tree refresh event", 1, logPad);
        this.fireTreeRefreshEvent(null, null, logPad + "   ");
        this.wrapper.log.methodDone("treemgr: workspace folder removed event", 1, logPad);
    };


    private openTerminal = (taskItem: TaskItem) =>
    {
        const term = getTerminal(taskItem);
        if (term) {
            term.show();
        }
    };


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
     * invalidate can be false when a grouping settingshas changed, where the tree needs to be rebuilt
     * but the file cache does not need to rebuild and  do not need to invalidate any task providers
     *
     * @param opt Uri of the invalidated resource
     */
    refresh = async(invalidate: string | false | undefined, opt: Uri | false | undefined, logPad: string) =>
    {
        this.wrapper.log.methodStart("treemgr: refresh task tree", 1, logPad, logPad === "", [
            [ "invalidate", invalidate ], [ "opt fsPath", this.wrapper.typeUtils.isUri(opt) ? opt.fsPath : "n/a" ]
        ]);

        await this.waitForRefreshComplete();
        this.refreshPending = true;

        if (this.wrapper.typeUtils.isUri(opt) && this.wrapper.fs.isDirectory(opt.fsPath) && !workspace.getWorkspaceFolder(opt))
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
        // else if (this.wrapper.utils.isString(invalidate, true) && this.wrapper.utils.isUri(opt))
        // {
        //     // TODO = Performance enhancement.  Handle a file deletejust like we do a workspace folder
        //     //        delete above.  And we can avoid the task refresh/fetch and tree rebuild.
        // }
        else
        {
            if (invalidate !== false) {
                await this.handleRebuildEvent(invalidate, opt, logPad + "   ");
            }
            if (opt !== false && this.wrapper.typeUtils.isString(invalidate, true))
            {
                this.wrapper.log.write(`   invalidation is for type '${invalidate}'`, 1, logPad);
                this.currentInvalidation = invalidate; // 'invalidate' will be taskType if 'opt' is undefined or uri of add/remove resource
            }
            else if (invalidate === false && opt === undefined) // rebuild tree only, tasks have not changed
            {
                this.wrapper.log.write("   no invalidation, rebuild tree only", 1, logPad);
                this._treeBuilder.invalidate();
                await this._treeBuilder.createTaskItemTree(logPad + "   ", 2);
            }
            else //
            {   // Re-ask for all tasks from all providers and rebuild tree
                //
                this.wrapper.log.write("   invalidation is for all types", 1, logPad);
                this.currentInvalidation = undefined;
                this._tasks = [];
            }
            this.wrapper.log.write("   fire tree data change event", 2, logPad);
            await this.loadTasks(logPad + "   "); // loadTasks invalidates treeBuilder, sets taskMap to {} and taskTree to null
        }

        this.wrapper.log.methodDone("treemgr: refresh task tree", 1, logPad);
    };


    private setContext = async() =>
    {
        const taskTypeProcessed: string[] = [],
              scriptFilesWithArgs: string[] = [],
              taskMap = <TaskItem[]>Object.values(this._treeBuilder.getTaskMap()).filter(i => !!i);
        for (const taskItem of taskMap)
        {
            const task = taskItem.task;
            if ((<ITaskDefinition>task.definition).takesArgs && taskItem.resourceUri) {
                scriptFilesWithArgs.push(taskItem.resourceUri.fsPath);
            }
            if (!taskTypeProcessed.includes(task.source)) { taskTypeProcessed.push(task.source); /* TODO */ }
        }
        scriptFilesWithArgs.sort();
        await this.wrapper.contextTe.setContext(`${ContextKeys.TasksPrefix}scriptFilesWithArgs`, scriptFilesWithArgs);
    };


    setMessage = (message?: string) =>
    {
        Object.values(this._views).filter(v => v.enabled && v.visible).forEach((v) => {
            v.view.message =  message;
        });
    };


    waitForRefreshComplete = async(maxWait = 15000, logPad = "   ") =>
    {
        let waited = 0;
        if (this.refreshPending) {
            this.wrapper.log.write("treemgr: waiting for previous refresh to complete...", 1, logPad);
        }
        while (this.refreshPending && waited < maxWait) {
            await this.wrapper.utils.sleep(250);
            waited += 250;
        }
    };

}

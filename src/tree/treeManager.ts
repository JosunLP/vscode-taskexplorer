
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeTreeView } from "./treeView";
import { Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { TaskManager } from "./taskManager";
import { isDirectory } from "../lib/utils/fs";
import { TaskTreeBuilder } from "./treeBuilder";
import { getTerminal } from "../lib/getTerminal";
import { FavoritesFolder } from "./favoritesFolder";
import { LastTasksFolder } from "./lastTasksFolder";
import { statusBarItem } from "../lib/statusBarItem";
import { addToExcludes } from "../lib/addToExcludes";
import { isTaskIncluded } from "../lib/isTaskIncluded";
import { getTaskRelativePath } from "../lib/utils/pathUtils";
import { Commands, registerCommand } from "../lib/command/command";
import { getTaskTypeFriendlyName, isScriptType } from "../lib/utils/taskUtils";
import { TreeItem, Uri, workspace, Task, tasks, Disposable, TreeItemCollapsibleState, EventEmitter, Event } from "vscode";
import { IDictionary, ITeTreeManager, ITeTaskChangeEvent, ITeTaskStatusChangeEvent, ITeTask, ITeRunningTaskChangeEvent } from "../interface";


export class TaskTreeManager implements ITeTreeManager, Disposable
{
    private _tasks: Task[] = [];
    private refreshPending = false;
    private _taskManager: TaskManager;
    private _treeBuilder: TaskTreeBuilder;
    private firstTreeBuildDone = false;
    private currentInvalidation: string | undefined;
    private readonly disposables: Disposable[] = [];
    private readonly _onDidTasksChange: EventEmitter<ITeTaskChangeEvent>;
    private readonly _onDidTaskCountChange: EventEmitter<ITeTaskChangeEvent>;
    private readonly _onReady: EventEmitter<ITeTaskChangeEvent>;

    private _specialFolders: {
        favorites: FavoritesFolder;
        lastTasks: LastTasksFolder;
    };

    private _views: {
        taskExplorer: TeTreeView;
        taskExplorerSideBar: TeTreeView;
    };


    constructor(private readonly wrapper: TeWrapper)
    {
        this.wrapper.log.methodStart("construct task tree manager", 1, "   ");

        this._onReady = new EventEmitter<ITeTaskChangeEvent>();
        this._onDidTasksChange = new EventEmitter<ITeTaskChangeEvent>();
        this._onDidTaskCountChange = new EventEmitter<ITeTaskChangeEvent>();

        const nodeExpandedeMap = this.wrapper.config.get<IDictionary<"Collapsed"|"Expanded">>("specialFolders.folderState");
        this._specialFolders = {
            favorites: new FavoritesFolder(wrapper, this, TreeItemCollapsibleState[nodeExpandedeMap.favorites]),
            lastTasks: new LastTasksFolder(wrapper, this, TreeItemCollapsibleState[nodeExpandedeMap.lastTasks])
        };

        this._treeBuilder = new TaskTreeBuilder(this, this._specialFolders);
        this._taskManager = new TaskManager(wrapper, this, this._specialFolders);

        this._views = {
            taskExplorer: new TeTreeView(wrapper, this, "Task Explorer", "", "taskTreeExplorer", "taskexplorer:treeView:taskTreeExplorer", "taskTreeExplorer"),
            taskExplorerSideBar: new TeTreeView(wrapper, this, "Task Explorer", "", "taskTreeSideBar", "taskexplorer:treeView:taskTreeSideBar", "taskTreeSideBar")
        };

        this.disposables.push(
            this._onReady,
            this._onDidTasksChange,
            this._onDidTaskCountChange,
            this._taskManager,
            this._treeBuilder,
            this._specialFolders.favorites,
            this._specialFolders.lastTasks,
            this._views.taskExplorer,
            this._views.taskExplorerSideBar,
            registerCommand(Commands.AddToExcludes, (item: TaskFile | TaskItem) => this.addToExcludes(item), this),
            registerCommand(Commands.AddRemoveCustomLabel, (item: TaskItem) => this.addRemoveSpecialTaskLabel(item), this),
            registerCommand(Commands.OpenTerminal, (item: TaskItem | ITeTask) => this.openTerminal(this.taskManager.getTask(item)), this),
            registerCommand(Commands.Refresh, (taskType?: string | false | undefined, uri?: Uri | false | undefined, logPad = "") => this.refresh(taskType, uri, logPad), this)
        );

        this.wrapper.log.methodDone("construct task tree manager", 1, "   ");
    }


    dispose()
    {
        this.disposables.forEach(d => d.dispose());
        this.disposables.splice(0);
        this._tasks = [];
    }


	get onDidAllTasksChange(): Event<ITeTaskChangeEvent> {
		return this._onDidTasksChange.event;
	}

    get onDidTaskCountChange(): Event<ITeTaskChangeEvent> {
		return this._onDidTaskCountChange.event;
	}

	get onDidFamousTasksChange(): Event<ITeTaskChangeEvent> {
		return this._taskManager.onDidFamousTasksChange;
	}

	get onDidFavoriteTasksChange(): Event<ITeTaskChangeEvent> {
		return this._specialFolders.favorites.onDidTasksChange;
	}

	get onDidLastTasksChange(): Event<ITeTaskChangeEvent> {
		return this._specialFolders.lastTasks.onDidTasksChange;
	}

    get onDidRunningTasksChange(): Event<ITeRunningTaskChangeEvent> {
        return this._taskManager.taskWatcher.onDidRunningTasksChange;
    }

    get onDidTaskStatusChange(): Event<ITeTaskStatusChangeEvent> {
        return this._taskManager.taskWatcher.onDidTaskStatusChange;
    }

    get onReady(): Event<ITeTaskChangeEvent> {
        return this._onReady.event;
    }

    get famousTasks(): ITeTask[] {
        return this._taskManager.usageTracker.getFamousTasks();
    }

    get favoriteTasks(): Task[] {
        return this._specialFolders.favorites.taskFiles.map(f => f.task);
    }

    get lastTasks(): Task[] {
        return this._specialFolders.lastTasks.taskFiles.map(f => f.task);
    }

    get lastTasksFolder() {
        return this._specialFolders.lastTasks;
    }

    get runningTasks(): Task[] {
        return this._taskManager.usageTracker.getRunningTasks();
    }

    get views() {
        return this._views;
    }

    get taskManager() {
        return this._taskManager;
    }

    private addRemoveSpecialTaskLabel = async(taskItem: TaskItem) =>
    {
        /* istanbul ignore else */
        if (taskItem.folder)
        {
            const folderName = this.wrapper.utils.lowerCaseFirstChar(taskItem.folder.label as string, true) as "favorites"|"lastTasks";
            return this._specialFolders[folderName].addRemoveRenamedLabel(taskItem);
        }
    };


    private addToExcludes = async(selection: TaskFile | TaskItem) =>
    {
        let uri: Uri | false;
        let excludesList = "exclude";
        const pathValues: string[] = [];

        this.wrapper.log.methodStart("add to excludes", 1, "", true, [[ "global", global ]]);

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
            if (isScriptType(selection.taskSource))
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

        this.wrapper.configWatcher.enableConfigWatcher(false);
        await addToExcludes(pathValues, excludesList, "   ");
        this.wrapper.configWatcher.enableConfigWatcher(true);

        await this.refresh(selection.taskSource, uri, "   ");

        this.wrapper.log.methodDone("add to excludes", 1);
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
            if (!isTaskIncluded(this.wrapper, item, getTaskRelativePath(item), logPad + "   "))
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
        this.wrapper.log.methodStart("do task cache removals", 2, logPad);
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
            if (!showUserTasks && item.source === "Workspace" && !this.wrapper.utils.isWorkspaceFolder(item.scope))
            {
                this._tasks.splice(object.length - 1 - index, 1);
            }
        });
        this.wrapper.log.write(`   removed ${ctRmv} ${invalidation} current tasks from cache`, 2, logPad);
        this.wrapper.log.methodDone("do task cache removals", 2, logPad);
    };


    private fetchTasks = async(logPad: string) =>
    {
        let count = this._tasks.length;
        this.wrapper.log.methodStart("fetch tasks", 1, logPad);
        if (this._tasks.length === 0 || !this.currentInvalidation || this.currentInvalidation  === "Workspace" || this.currentInvalidation === "tsc")
        {
            this.wrapper.log.write("   fetching all tasks via VSCode fetchTasks call", 1, logPad);
            statusBarItem.update("Requesting all tasks from all providers");
            this._tasks = await tasks.fetchTasks();
            //
            // Process the tasks cache array for any removals that might need to be made
            //
            this.doTaskCacheRemovals(undefined, logPad + "   "); // removes user tasks
        }     //
        else // this.currentInvalidation guaranteed to be a string (task type) here
        {   //
            const taskName = getTaskTypeFriendlyName(this.currentInvalidation);
            this.wrapper.log.write(`   fetching ${taskName} tasks via VSCode fetchTasks call`, 1, logPad);
            statusBarItem.update("Requesting  tasks from " + taskName + " task provider");
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
        //
        // If this is the first time the tree is being built, do a few extra things
        //
        const licMgr = this.wrapper.licenseManager;
        const maxTasks = licMgr.getMaxNumberOfTasks();
        if (!this.firstTreeBuildDone)
        {   //
            // Update license manager w/ tasks, display info / license page if needed
            //
            await licMgr.setTasks(this._tasks, logPad + "   ");
            this.setMessage(Strings.BuildingTaskTree);
        }
        //
        // Check License Manager for any task count restrictions
        //
        if (this._tasks.length > maxTasks)
        {
            let ctRmv = 0;
            ctRmv = this._tasks.length - maxTasks;
            this.wrapper.log.write(`      removing ${ctRmv} tasks, max count reached (no license)`, 3, logPad);
            this._tasks.splice(maxTasks, ctRmv);
            this.wrapper.utils.showMaxTasksReachedMessage(licMgr);
        }
        //
        // Create/build the ui task tree
        //
        await this._treeBuilder.createTaskItemTree(logPad + "   ", 2);
        //
        // Signal that the task list / tree has changed
        //
        queueMicrotask(() =>
        {
            const iTasks = this.wrapper.taskUtils.toITask(this.wrapper.usage, this._tasks, "all");
            this._onDidTasksChange.fire({ tasks: iTasks, type: "all" });
            if (this._tasks.length !== count) {
                this._onDidTaskCountChange.fire({ tasks: iTasks, type: "all" });
            }
            if (!this.firstTreeBuildDone) {
                this._onReady.fire({ tasks: iTasks, type: "all" });
            }
            this.firstTreeBuildDone = true;
        });
        //
        // Done!
        //
        this.wrapper.log.methodDone("fetch tasks", 1, logPad);
    };


    fireTreeRefreshEvent = (logPad: string, logLevel: number, treeItem?: TreeItem) =>
    {
        // Object.values(this._views).filter(v => v.enabled && v.visible).forEach((v) =>
        Object.values(this._views).filter(v => v.enabled).forEach((v) =>
        {
            v.tree.fireTreeRefreshEvent(logPad + "   ", logLevel, treeItem);
        });
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
        this.wrapper.log.methodStart("handle tree rebuild event", 1, logPad);
        if (invalidate === undefined && opt === undefined) // i.e. refresh button was clicked
        {
            this.wrapper.log.write("   handling 'rebuild cache' event", 1, logPad + "   ");
            this.setMessage(Strings.ScanningTaskFiles);
            await this.wrapper.filecache.rebuildCache(logPad + "   ");
            this.wrapper.log.write("   handling 'rebuild cache' event complete", 1, logPad + "   ");
        }
        this.wrapper.log.write("   handling 'invalidate tasks cache' event", 1, logPad);
        await this.invalidateTasksCache(invalidate, opt, logPad + "   ");
        this.wrapper.log.methodDone("   handle tree rebuild event", 1, logPad);
    };


    loadTasks = async(logPad: string) =>
    {
        this.wrapper.log.methodStart("construct task tree manager", 1, logPad);
        this.refreshPending = true;
        this._treeBuilder.invalidate();
        this.setMessage(Strings.RequestingTasks);
        await this.fetchTasks(logPad + "   ");
        this.setMessage();
        this.fireTreeRefreshEvent(logPad + "   ", 1);
        this.refreshPending = false;
        this.wrapper.log.methodDone("construct task tree manager", 1, logPad);
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


    isBusy = () => this.refreshPending || this._treeBuilder.isBusy();
    // isBusy = () => this.views.taskExplorer.tree.isBusy() || this.views.taskExplorerSideBar.tree.isBusy() ||
    //                this.refreshPending || this._treeBuilder.isBusy();


    private onWorkspaceFolderRemoved = (uri: Uri, logPad: string) =>
    {
        this.wrapper.log.methodStart("workspace folder removed event", 1, logPad, false, [[ "path", uri.fsPath ]]);
        let ctRmv = 0;
        const tasks = this._tasks,
                taskMap = this._treeBuilder.getTaskMap(),
                taskTree = this._treeBuilder.getTaskTree() as TaskFolder[];

        this.wrapper.log.write("   removing project tasks from cache", 1, logPad);
        this.wrapper.log.values(1, logPad + "      ", [
            [ "current # of tasks", tasks.length ], [ "current # of tree folders", taskTree.length ],
            [ "project path removed", uri.fsPath ]
        ]);
        statusBarItem.update("Deleting all tasks from removed project folder");
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
        this.fireTreeRefreshEvent(logPad + "   ", 1);
        this.refreshPending = false;
        this.wrapper.log.write("   workspace folder event has been processed", 1, logPad);
        this.wrapper.log.methodDone("workspace folder removed event", 1, logPad);
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
        this.wrapper.log.methodStart("refresh task tree", 1, logPad, logPad === "", [
            [ "invalidate", invalidate ], [ "opt fsPath", this.wrapper.utils.isUri(opt) ? opt.fsPath : "n/a" ]
        ]);

        await this.waitForRefreshComplete();
        this.refreshPending = true;

        if (this.wrapper.utils.isUri(opt) && isDirectory(opt.fsPath) && !workspace.getWorkspaceFolder(opt))
        {   //
            // A workspace folder was removed.  We know it's a workspace folder because isDirectory()
            // returned true and getWorkspaceFolder() returned false.  If it was a regular directory
            // getting deleted from within a ws folder, then isDirectory() will not return true due
            // to no existing dir anymore to stat.  The getWorkspaceFolder() would also return a valid
            // ws project folder if it was just a dir delete or a dir add, or a ws folder add.  We
            // break out this case with a different handler since we can improve the performance pretty
            // significantly for this specific event.
            //
            this.onWorkspaceFolderRemoved(opt, logPad);
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
            if (opt !== false && this.wrapper.utils.isString(invalidate, true))
            {
                this.wrapper.log.write(`   invalidation is for type '${invalidate}'`, 1, logPad);
                this.currentInvalidation = invalidate; // 'invalidate' will be taskType if 'opt' is undefined or uri of add/remove resource
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

        this.wrapper.log.methodDone("refresh task tree", 1, logPad);
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
            this.wrapper.log.write("waiting for previous refresh to complete...", 1, logPad);
        }
        while (this.refreshPending && waited < maxWait) {
            await this.wrapper.utils.timeout(250);
            waited += 250;
        }
    };

}

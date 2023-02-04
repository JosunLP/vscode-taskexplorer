/* eslint-disable prefer-arrow/prefer-arrow-functions */

import * as task from "./task";
import * as utils from "../lib/utils/utils";
import TaskFile from "./file";
import TaskItem from "./item";
import log from "../lib/log/log";
import TaskFolder from "./folder";
import TaskTree from "../tree/tree";
import constants from "../lib/constants";
import TaskTreeBuilder from "./treeBuilder";
import SpecialTaskFolder from "./specialFolder";
import statusBarItem from "../lib/statusBarItem";
import ITaskTreeManager from "../interface/ITaskTreeManager";
import { isDirectory } from "../lib/utils/fs";
import { rebuildCache } from "../lib/fileCache";
import { IEvent } from "../interface/IEvent";
import { getTerminal } from "../lib/getTerminal";
import { addToExcludes } from "../lib/addToExcludes";
import { isTaskIncluded } from "../lib/isTaskIncluded";
import { TaskWatcher } from "../lib/watcher/taskWatcher";
import { configuration } from "../lib/utils/configuration";
import { getTaskRelativePath } from "../lib/utils/pathUtils";
import { IDictionary, ITaskExplorerApi } from "../interface";
import { getLicenseManager, providers } from "../extension";
import { getTaskTypeFriendlyName, isScriptType } from "../lib/utils/taskTypeUtils";
import {
    ExtensionContext, window, TreeView, TreeItem, Uri, workspace, Task, commands, tasks, Disposable, TreeItemCollapsibleState
} from "vscode";


let teApi: ITaskExplorerApi;

interface TeTreeView
{
    view: TreeView<TreeItem>;
    tree: TaskTree;
}


export class TaskTreeManager implements ITaskTreeManager, Disposable
{
    private static tasks: Task[] = [];
    private static refreshPending = false;
    private static specialFolders: {
        favorites: SpecialTaskFolder;
        lastTasks: SpecialTaskFolder;
    };

    private tasks: Task[];
    private taskWatcher: TaskWatcher;
    private treeBuilder: TaskTreeBuilder;
    private eventQueue: IEvent[] = [];
    private firstTreeBuildDone = false;
    private currentInvalidation: string | undefined;
    private currentInvalidationUri: Uri | undefined;
    private currentRefreshEvent: string | undefined;
    private disposables: Disposable[] = [];
    private views: IDictionary<TeTreeView|undefined> = {
        taskExplorer: undefined,
        taskExplorerSideBar: undefined
    };


    constructor(context: ExtensionContext, api: ITaskExplorerApi)
    {
        log.methodStart("construct task tree manager", 1, "   ");
        teApi = api;
        this.tasks = TaskTreeManager.tasks;

        const nodeExpandedeMap = configuration.get<IDictionary<"Collapsed"|"Expanded">>("specialFolders.folderState");
        TaskTreeManager.specialFolders = {
            favorites: new SpecialTaskFolder(this, constants.FAV_TASKS_LABEL, TreeItemCollapsibleState[nodeExpandedeMap.favorites]),
            lastTasks: new SpecialTaskFolder(this, constants.LAST_TASKS_LABEL, TreeItemCollapsibleState[nodeExpandedeMap.lastTasks])
        };
        this.disposables.push(TaskTreeManager.specialFolders.favorites);
        this.disposables.push(TaskTreeManager.specialFolders.lastTasks);

        this.taskWatcher = new TaskWatcher(this, TaskTreeManager.specialFolders);
        this.disposables.push(this.taskWatcher);

        this.treeBuilder = new TaskTreeBuilder(this, TaskTreeManager.specialFolders);
        this.disposables.push(this.treeBuilder);

        this.disposables.push(commands.registerCommand("vscode-taskexplorer.refresh", () => this.refresh(true, false, ""), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.addRemoveCustomLabel", async(taskItem: TaskItem) => this.addRemoveSpecialTaskLabel(taskItem), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.run",  async (item: TaskItem) => task.run(item), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runNoTerm",  async (item: TaskItem) => task.run(item, true, false), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runWithArgs",  async (item: TaskItem, args?: string) => task.run(item, false, true, args), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runLastTask",  async () => task.runLastTask(this.treeBuilder.getTaskMap()), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.stop", async (item: TaskItem) => task.stop(item), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.restart",  async (item: TaskItem) => task.restart(item), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.pause",  (item: TaskItem) => task.pause(item), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.open", async (item: TaskItem, itemClick?: boolean) => task.open(item, itemClick), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.openTerminal", (item: TaskItem) => this.openTerminal(item), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runInstall", async (taskFile: TaskFile) => task.runNpmCommand(taskFile, "install"), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runUpdate", async (taskFile: TaskFile) => task.runNpmCommand(taskFile, "update"), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runUpdatePackage", async (taskFile: TaskFile) => task.runNpmCommand(taskFile, "update <packagename>"), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runAudit", async (taskFile: TaskFile) => task.runNpmCommand(taskFile, "audit"), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.runAuditFix", async (taskFile: TaskFile) => task.runNpmCommand(taskFile, "audit fix"), this));
        this.disposables.push(commands.registerCommand("vscode-taskexplorer.addToExcludes", async (taskFile: TaskFile | TaskItem) => this.addToExcludes(taskFile), this));

        this.createTaskTree("taskExplorer", "      ");
        this.createTaskTree("taskExplorerSideBar", "      ");

        context.subscriptions.push(this);

        log.methodDone("construct task tree manager", 1, "   ");
    }


    dispose()
    {
        this.disposables.forEach((d) => {
            d.dispose();
        });
        this.tasks = [];
        this.disposables = [];
    }


    private addRemoveSpecialTaskLabel = async(taskItem: TaskItem) =>
    {
        /* istanbul ignore else */
        if (taskItem.folder)
        {
            const folderName = utils.lowerCaseFirstChar(taskItem.folder.label as string, true) as "favorites"|"lastTasks";
            return TaskTreeManager.specialFolders[folderName].addRemoveRenamedLabel(taskItem);
        }
    };


    private addToExcludes = async(selection: TaskFile | TaskItem) =>
    {
        let uri: Uri | false;
        let excludesList = "exclude";
        const pathValues: string[] = [];

        log.methodStart("add to excludes", 1, "", true, [[ "global", global ]]);

        if (selection instanceof TaskFile)
        {
            uri = selection.resourceUri;
            if (selection.isGroup)
            {
                log.value("   adding file group", uri.path, 2);
                for (const each of selection.treeNodes.filter(n => !!n.resourceUri))
                {
                    const  uri = each.resourceUri as Uri;
                    log.value("      adding file path", uri.path, 3);
                    pathValues.push(uri.path);
                }
            }
            else {
                log.value("   adding file path", uri.path, 2);
                pathValues.push(uri.path);
            }
        }
        else // if (selection instanceof TaskItem)
        {
            uri = false;
            if (isScriptType(selection.taskSource))
            {
                const resourceUri = selection.resourceUri as Uri;
                log.value("   adding file path", resourceUri.path, 2);
                pathValues.push(resourceUri.path);
            }
            else {
                excludesList = "excludeTask";
                pathValues.push(selection.task.name);
            }
        }

        await addToExcludes(pathValues, excludesList, true, "   ");

        await this.refresh(selection.taskSource, uri, "   ");

        log.methodDone("add to excludes", 1);
    };


    private cleanFetchedTasks = (logPad: string) =>
    {
        let ctRmv = 0;
        const tasksCache = this.tasks;
        log.write("removing any ignored tasks from new fetch", 3, logPad);
        tasksCache.slice().reverse().forEach((item, index, object) => // niftiest loop ever
        {   //
            // Make sure this task shouldn't be ignored based on various criteria...
            // Process only if this task type/source is enabled in settings or is scope is empty (VSCode provided task)
            // By default, also ignore npm 'install' tasks, since its available in the context menu, ignore
            // other providers unless it has registered as an external provider via Task Explorer API.
            // Only internally provided tasks will be present in the this.tasks cache at this point, as extension
            // provided tasks will have been skipped/ignored in the provideTasks() processing.
            //
            if (!isTaskIncluded(item, getTaskRelativePath(item), logPad + "   "))
            {
                ++ctRmv;
                tasksCache.splice(object.length - 1 - index, 1);
                log.value("   ignoring task", item.name, 3, logPad);
            }
        });
        log.write(`ignored ${ctRmv} ${this.currentInvalidation} tasks from new fetch`, 3, logPad);
    };


    private createTaskTree = (name: "taskExplorer"|"taskExplorerSideBar", logPad: string) =>
    {
        log.methodStart("create task tree provider", 1, logPad, false, [[ "name", name ]]);
        if (!this.views[name])
        {
            const taskTree = new TaskTree(name, this),
                  treeView = window.createTreeView(name, { treeDataProvider: taskTree, showCollapseAll: true });
            //
            // Add to tracked disposables
            //
            this.disposables.push(taskTree);
            this.disposables.push(treeView);
            //
            // Create inVisibilityChanged event on the task tree instance and have the call
            // add to the tracked disposables array
            //
            treeView.onDidChangeVisibility((e) =>
            {
                taskTree.onVisibilityChanged(e.visible, this.firstTreeBuildDone);
            },
            this, this.disposables);
            //
            // Set view/tree pair in tracked views dictionary
            //
            this.views[name] = { view: treeView, tree: taskTree };
            //
            // Set instances in TeApi
            //
            if (name === "taskExplorer")
            {
                teApi.testsApi.explorer = teApi.explorer = taskTree;
                teApi.explorerView = treeView;
            }
            else {
                teApi.testsApi.explorer = teApi.sidebar = taskTree;
                teApi.sidebarView = treeView;
            }
            log.write("   tree data provider '" + name + "' created", 1, logPad);
        }
        log.methodDone("create task tree provider", 1, logPad);
    };


    private disposeTaskTree = (name: "taskExplorer"|"taskExplorerSideBar", logPad: string) =>
    {
        log.methodStart("dispose explorer view / tree provider", 1, logPad, false, [[ "name", name ]]);
        const view = this.views[name];
        if (view)
        {   //
            // Get/remove the 3 disposables created in createTaskTree() and dispose() each
            //
            const disposables = this.disposables.splice(this.disposables.findIndex(s => s instanceof TaskTree && s.getName() === name), 3);
            disposables.forEach((d) => {
                d.dispose();
            });
            this.views[name] = undefined;
            if (name === "taskExplorer")
            {
                teApi.explorer = undefined;
                teApi.explorerView = undefined;
            }
            else
            {
                teApi.sidebar = undefined;
                teApi.sidebarView = undefined;
            }
            teApi.testsApi.explorer = (teApi.explorer || teApi.sidebar) as TaskTree;
            log.write("   tree data provider '" + name + "' un-registered", 1, "   ");
        }
        log.methodDone("dispose explorer view / tree provider", 1, logPad);
    };


    private doTaskCacheRemovals = (invalidation: string | undefined, logPad: string) =>
    {
        let ctRmv = 0;
        log.methodStart("do task cache removals", 2, logPad);
        const showUserTasks = configuration.get<boolean>("specialFolders.showUserTasks");
        this.tasks.slice().reverse().forEach((item, index, object) => // niftiest loop ever
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
                    this.tasks.splice(object.length - 1 - index, 1);
                    log.write(`      removed task '${item.source}/${item.name}'`, 3, logPad);
                    ++ctRmv;
                }
            }
            //
            // Remove User tasks if they're not enabled
            //
            if (!showUserTasks && item.source === "Workspace" && !utils.isWorkspaceFolder(item.scope))
            {
                this.tasks.splice(object.length - 1 - index, 1);
            }
        });
        log.write(`   removed ${ctRmv} ${invalidation} current tasks from cache`, 2, logPad);
        log.methodDone("do task cache removals", 2, logPad);
    };


    enableTaskTree = (name: "taskExplorer"|"taskExplorerSideBar", enable: boolean, logPad: string) =>
    {
        log.methodStart("enable explorer view / tree provider", 1, logPad, false, [[ "name", name ], [ "enable", enable ]]);
        if (enable) {
            this.createTaskTree(name, logPad + "   ");
        }
        else {
            this.disposeTaskTree(name, logPad + "   ");
        }
        log.methodDone("enable explorer view / tree provider", 1, logPad);
    };


    private fetchTasks = async(logPad: string) =>
    {
        log.methodStart("fetch tasks", 1, logPad);
        if (this.tasks.length === 0 || !this.currentInvalidation || this.currentInvalidation  === "Workspace" || this.currentInvalidation === "tsc") // || this.currentInvalidationUri)
        {
            log.write("   fetching all tasks via VSCode fetchTasks call", 1, logPad);
            statusBarItem.update("Requesting all tasks from all providers");
            this.tasks = TaskTreeManager.tasks = await tasks.fetchTasks();
            //
            // Process the tasks cache array for any removals that might need to be made
            //
            this.doTaskCacheRemovals(undefined, logPad + "   "); // removes user tasks
        }     //
        else // this.currentInvalidation guaranteed to be a string (task type) here
        {   //
            const taskName = getTaskTypeFriendlyName(this.currentInvalidation);
            log.write(`   fetching ${taskName} tasks via VSCode fetchTasks call`, 1, logPad);
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
            log.write(`   adding ${taskItems.length} new ${this.currentInvalidation} tasks`, 2, logPad);
            this.tasks.push(...taskItems);
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
        const licMgr = getLicenseManager();
        const maxTasks = licMgr.getMaxNumberOfTasks();
        if (!this.firstTreeBuildDone)
        {   //
            // Update license manager w/ tasks, display info / license page if needed
            //
            await licMgr.setTasks(this.tasks, logPad + "   ");
            //
            // Fire a tree refresh event, any visible trees will update it's space with
            // a 'Building Tree...' item.
            //
            this.fireTreeRefreshEvent(logPad + "   ", 2);
        }
        //
        // Check License Manager for any task count restrictions
        //
        if (this.tasks.length > maxTasks)
        {
            let ctRmv = 0;
            ctRmv = this.tasks.length - maxTasks;
            log.write(`      removing ${ctRmv} tasks, max count reached (no license)`, 3, logPad);
            this.tasks.splice(maxTasks, ctRmv);
            utils.showMaxTasksReachedMessage(licMgr);
        }
        //
        // Create/build the ui task tree if not built already
        //
        await this.treeBuilder.createTaskItemTree(logPad + "   ", 2);
        //
        // Done!
        //
        this.firstTreeBuildDone = true;
        log.methodDone("fetch tasks", 1, logPad);
    };


    fireTreeRefreshEvent = (logPad: string, logLevel: number, treeItem?: TreeItem) =>
    {
        Object.values(this.views).filter(v => !!v && v.tree).forEach((v) =>
        {
            (v as TeTreeView).tree.fireTreeRefreshEvent(logPad + "   ", logLevel, treeItem);
        });
    };


    static getlastTasksFolder = () => this.specialFolders.lastTasks;


    getTaskMap = () => this.treeBuilder.getTaskMap();


    getTasks = () => this.tasks;


    getTaskTree = () => this.treeBuilder.getTaskTree();


    static getTaskMap = () => TaskTreeBuilder.getTaskMap();


    static getTasks = () => this.tasks;


    private handleRebuildEvent = async(invalidate: any, opt: boolean | Uri | undefined, logPad: string) =>
    {   //
        // The file cache only needs to update once on any change, since this will get called through
        // twice if both the Explorer and Sidebar Views are enabled, do a lil check here to make sure
        // we don't double scan for nothing.
        //
        log.methodStart("handle tree rebuild event", 1, logPad);
        if (invalidate === true && !opt)
        {
            log.write("   handling 'rebuild cache' event", 1, logPad + "   ");
            await rebuildCache(logPad + "   ");
            log.write("   handling 'rebuild cache' event complete", 1, logPad + "   ");
        }
        log.write("   handling 'invalidate tasks cache' event", 1, logPad);
        await this.invalidateTasksCache(invalidate !== true ? invalidate : undefined, opt, logPad + "   ");
        log.methodDone("   handle tree rebuild event", 1, logPad);
    };


    loadTasks = async(logPad: string) =>
    {
        log.methodStart("construct task tree manager", 1, logPad);
        TaskTreeManager.refreshPending = true;
        this.treeBuilder.invalidate();
        await this.fetchTasks(logPad + "   ");
        this.fireTreeRefreshEvent(logPad + "   ", 1);
        TaskTreeManager.refreshPending = false;
        log.methodDone("construct task tree manager", 1, logPad);
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
        log.methodStart("invalidate tasks cache", 1, logPad, false, [
            [ "opt1", opt1 ], [ "opt2", opt2 && opt2 instanceof Uri ? opt2.fsPath : opt2 ]
        ]);

        try {
            if (opt1 && opt2 instanceof Uri)
            {
                log.write("   invalidate '" + opt1 + "' task provider file ", 1, logPad);
                log.value("      file", opt2.fsPath, 1, logPad);
                // NPM/Workspace/TSC tasks don't implement TaskExplorerProvider
                await providers[opt1]?.invalidate(opt2, logPad + "   ");
            }
            else //
            {   // If opt1 is undefined, refresh all providers
                //
                if (!opt1)
                {
                    log.write("   invalidate all providers", 1, logPad);
                    for (const [ key, p ] of Object.entries(providers))
                    {
                        log.write("   invalidate '" + key + "' task provider", 1, logPad);
                        await p.invalidate(undefined, logPad + "   ");
                    }
                }
                else { // NPM/Workspace/TSC tasks don't implement TaskExplorerProvider
                    log.write("   invalidate '" + opt1 + "' task provider", 1, logPad);
                    providers[opt1]?.invalidate(undefined, logPad + "   ");
                }
            }
        }
        catch (e: any) {
            /* istanbul ignore next */
            log.error([ "Error invalidating task cache", e ]);
        }

        log.methodDone("invalidate tasks cache", 1, logPad);
    };


    static isBusy = () => this.refreshPending || TaskTreeBuilder.isBusy();


    private onWorkspaceFolderRemoved = (uri: Uri, logPad: string) =>
    {
        log.methodStart("workspace folder removed event", 1, logPad, false, [[ "path", uri.fsPath ]]);
        let ctRmv = 0;
        const tasks = this.tasks,
                taskMap = this.treeBuilder.getTaskMap(),
                taskTree = this.treeBuilder.getTaskTree() as TaskFolder[];

        log.write("   removing project tasks from cache", 1, logPad);
        log.values(1, logPad + "      ", [
            [ "current # of tasks", tasks.length ], [ "current # of tree folders", taskTree.length ],
            [ "project path removed", uri.fsPath ]
        ]);
        statusBarItem.update("Deleting all tasks from removed project folder");
        tasks.reverse().forEach((item, index, object) =>
        {
            if (item.definition.uri && item.definition.uri.fsPath.startsWith(uri.fsPath))
            {
                log.write(`      removing task '${item.source}/${item.name}' from task cache`, 2, logPad);
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
        log.write(`      removed ${ctRmv} tasks from task cache`, 1, logPad);
        log.values(1, logPad + "      ", [
            [ "new # of tasks", tasks.length ], [ "new # of tree folders", taskTree.length ]
        ]);
        this.fireTreeRefreshEvent(logPad + "   ", 1);
        TaskTreeManager.refreshPending = false;
        log.write("   workspace folder event has been processed", 1, logPad);
        log.methodDone("workspace folder removed event", 1, logPad);
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
    refresh = async(invalidate: string | boolean | undefined, opt: Uri | false | undefined, logPad: string) =>
    {
        log.methodStart("refresh task tree", 1, logPad, logPad === "", [
            [ "invalidate", invalidate ], [ "opt fsPath", utils.isUri(opt) ? opt.fsPath : "n/a" ]
        ]);

        await this.waitForRefreshComplete();
        TaskTreeManager.refreshPending = true;

        if (utils.isUri(opt) && isDirectory(opt.fsPath) && !workspace.getWorkspaceFolder(opt))
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
        else
        {
            if (invalidate !== false) {
                await this.handleRebuildEvent(invalidate, opt, logPad + "   ");
            }
            if (opt !== false && utils.isString(invalidate, true))
            {
                log.write(`   invalidation is for type '${invalidate}'`, 1, logPad);
                this.currentInvalidation = invalidate; // 'invalidate' will be taskType if 'opt' is undefined or uri of add/remove resource
                this.currentInvalidationUri = opt;     // 'invalidate' will be undefined if 'opt' is uri of add/remove ws folder
            }
            else //
            {   // Re-ask for all tasks from all providers and rebuild tree
                //
                log.write("   invalidation is for all types", 1, logPad);
                this.currentInvalidation = undefined;
                this.tasks = TaskTreeManager.tasks = [];
                this.currentInvalidationUri = utils.isUri(opt)  ? opt : undefined;
            }
            log.write("   fire tree data change event", 2, logPad);
            await this.loadTasks(logPad + "   "); // loadTasks invalidates treeBuilder, sets taskMap to {} and taskTree to null
        }

        log.methodDone("refresh task tree", 1, logPad);
    };


    waitForRefreshComplete = async(maxWait = 15000, logPad = "   ") =>
    {
        let waited = 0;
        if (TaskTreeManager.refreshPending) {
            log.write("waiting for previous refresh to complete...", 1, logPad);
        }
        while (TaskTreeManager.refreshPending && waited < maxWait) {
            await utils.timeout(250);
            waited += 250;
        }
    };

}

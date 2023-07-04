
import { join } from "path";
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeGrouper } from "./treeGrouper";
import { SpecialTaskFolder } from "./specialFolder";
import { IDict, ITeTask, TaskMap } from "../interface";
import { Task, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";


export class TaskTreeBuilder
{
    private _taskMap: TaskMap<TaskItem>;
    private _taskFileMap: TaskMap<TaskFile>;
    private _taskFolderMap: TaskMap<TaskFolder|SpecialTaskFolder>;
    private _taskTree: TaskFolder[] | undefined | null | void = null;

    private readonly _treeGrouper: TaskTreeGrouper;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._taskMap = {};
        this._taskFileMap = {};
        this._taskFolderMap = {};
        this._treeGrouper = new TaskTreeGrouper(wrapper);
    }


    private buildTree = async(logPad: string): Promise<void> =>
    {
        let taskCt = 0;
        const tasks = this.wrapper.treeManager.getTasks(),
              isFullBuild = this.wrapper.typeUtils.isObjectEmpty(this._taskFolderMap);
        //
        this.wrapper.log.methodStart("build task tree", 2, logPad);
        //
        // Loop through each task provided by the engine and build a task tree
        //
        for (const each of tasks)
        {
            this.wrapper.log.blank(4);
            this.wrapper.log.write(`   Processing task ${++taskCt} of ${ tasks.length} (${each.source})`, 4, logPad);
            await this.buildTaskTree(each, logPad + "   ");
        }
        //
        // Build groupings and sort root taskfolders
        //
        if (!this.wrapper.typeUtils.isObjectEmpty(this._taskFolderMap))
        {
            if (isFullBuild) {
                await this._treeGrouper.buildGroupings(this._taskFolderMap, this._taskFileMap, logPad + "   ");
            }
            //
            // Get sorted root project folders - only project folders are sorted, special folders
            // e.g. 'Favorites', 'User Tasks' and 'Last Tasks' are kept at the top of the list.
            //
            this._taskTree = this.wrapper.sorters.sortFolders(this._taskFolderMap) as TaskFolder[];
        }
        this.wrapper.log.methodDone("build task tree", 2, logPad);
    };


    private buildTaskTree = async(each: Task, logPad: string): Promise<void> =>
    {
        let folder: TaskFolder | undefined,
            scopeName: string;

        this.wrapper.log.methodStart("build task tree list", 2, logPad, true, [
            [ "name", each.name ], [ "source", each.source ], [ "definition type", each.definition.type ],
            [ "definition path", each.definition.path ]
        ]);
        this.wrapper.log.value("   scope", each.scope, 4, logPad);
        const relativePath = this.wrapper.pathUtils.getTaskRelativePath(each);
        //
        // Set scope name and create the TaskFolder, a "user" task will have a TaskScope scope, not
        // a WorkspaceFolder scope.
        //
        if (this.wrapper.typeUtils.isWorkspaceFolder(each.scope))
        {
            scopeName = each.scope.name;
            folder = this._taskFolderMap[scopeName];
            if (!folder)
            {
                const key = this.wrapper.utils.lowerCaseFirstChar(scopeName, true),
                      state = this.wrapper.config.get<"Collapsed"|"Expanded">(`${this.wrapper.keys.Config.SpecialFoldersFolderState}.${key}`, "Expanded");
                folder = new TaskFolder(each.scope, TreeItemCollapsibleState[state]);
                this._taskFolderMap[scopeName] = folder;
                this.wrapper.log.value("constructed tree taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
        }     //
        else // User Task (not related to a ws or project)
        {   //
            scopeName = this.wrapper.keys.Strings.USER_TASKS_LABEL;
            folder = this._taskFolderMap[scopeName];
            if (!folder)
            {
                const nodeExpandedeMap = this.wrapper.config.get<IDict<"Collapsed"|"Expanded">>(this.wrapper.keys.Config.SpecialFoldersFolderState);
                folder = new TaskFolder(scopeName, TreeItemCollapsibleState[nodeExpandedeMap[this.wrapper.utils.lowerCaseFirstChar(scopeName, true)]]);
                this._taskFolderMap[scopeName] = folder;
                this.wrapper.log.value("constructed tree user taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
        }
        //
        // Log the task details now that `scopeName` is set
        //
        this.logTask(each, scopeName, logPad + "   ");
        //
        // Get task file node, this will create one of it doesn't exist
        //
        const taskFile = await this.getTaskFileNode(each, folder, relativePath, scopeName, logPad + "   ");
        //
        // Create and add task item to task file node
        //
        // If this is an 'NPM Install' task, then we do not add the "tree item".  We do however add
        // the "tree file" (above), so that the npm management tasks (including install update, audit,
        // etc) are available via context menu of the "tree file" that represents the folder that the
        // package.json file is found in.  Pre-v2.0.5, we exited earlier if an 'npm install' task was
        // found, but in doing so, if there were no npm "scripts" in the package.json, code execution
        // would not get far enough to create the "tree file" node for the context menu.
        //
        const isNpmInstallTask = each.source === "npm" && (each.name === "install" || each.name.startsWith("install - "));
        if (!isNpmInstallTask)
        {   //
            // Create "tree item" node and add it to the owner "tree file" node
            //
// *************************************************************************************
            // const taskItem = new TaskItem(taskFile, each, logPad + "   ");
            // taskFile.addTreeNode(taskItem);
// *************************************************************************************
            const fsPath = !each.definition.scriptFile ? taskFile.resourceUri.fsPath : each.definition.uri.fsPath;
            let taskItem = taskFile.treeNodes.find((n): n is TaskItem => n instanceof TaskItem &&  n.id === TaskItem.createId(fsPath, each));
            if (!taskItem)
            {
                taskItem = new TaskItem(taskFile, each, logPad + "   ");
                taskFile.addTreeNode(taskItem);
            }
// *************************************************************************************
            this._taskMap[taskItem.id] = taskItem;
        }

        this.wrapper.log.methodDone("build task tree list", 2, logPad);
    };


    createTaskItemTree = async(rebuild: boolean, logPad: string) =>
    {
        this.wrapper.log.methodStart("create task tree", 1, logPad);
        this.wrapper.statusBar.update(this.wrapper.keys.Strings.BuildingTaskTree);
        if (rebuild) { this.invalidate(); }
        await this.buildTree(logPad + "   ");
        this.wrapper.statusBar.update("");
        this.wrapper.log.methodDone("create task tree", 1, logPad, [[ "current task count", this.wrapper.treeManager.getTasks().length ]]);
    };


    private getTaskFileNode = async(task: Task, folder: TaskFolder, relativePath: string, scopeName: string, logPad: string) =>
    {
        let taskFile: TaskFile | undefined;
        this.wrapper.log.methodStart("get task file node", 2, logPad, false, [[ "relative path", relativePath ], [ "scope name", scopeName ]]);
        //
        // Reference ticket #133, vscode folder should not use a path appenditure in it's folder label
        // in the task tree, there is only one path for vscode/workspace tasks, /.vscode.  The fact that
        // you can set the path variable inside a vscode task changes the relativePath for the task,
        // causing an endless loop when putting the tasks into groups (see _taskTree.createTaskGroupings).
        // All other task types will have a relative path of it's location on the filesystem (with
        // exception of TSC, which is handled elsewhere).
        //
        const id = TaskFile.getId(folder, task, undefined, 0);
        taskFile = this._taskFileMap[id];
        // let id: string;
        // for (let i = 0; i < 10 && !taskFile; i++)
        // {
        //     id = TaskFile.getId(folder, task, undefined, i);
        //     taskFile = this._taskFileMap[id];
        // }
        if (!taskFile)
        {
            this.wrapper.log.value("   Add source taskfile container", task.source, 2, logPad);
            taskFile = new TaskFile(folder, task, relativePath, 0, undefined, task.source, logPad + "   ");
            this._taskFileMap[taskFile.id] = taskFile;
            folder.addTaskFile(taskFile);
        }
        this.wrapper.log.methodDone("get task file node", 2, logPad);
        return taskFile;
    };


    getTaskMap = () => this._taskMap;


    getTaskTree = () => this._taskTree;


    private invalidate  = () => { this._taskMap = {}; this._taskFileMap = {}; this._taskFolderMap = {}; this._taskTree = null; };


    private logTask = (task: Task, scopeName: string, logPad: string) =>
    {
        const w = this.wrapper,
              definition = task.definition;
        if (!w.log.isLoggingEnabled()) {
            return;
        }
        w.log.write("Task Details:", 3, logPad);
        w.log.value("   name", task.name, 3, logPad);
        w.log.value("   source", task.source, 3, logPad);
        w.log.value("   scope name", scopeName, 4, logPad);
        w.utils.execIf(w.typeUtils.isWorkspaceFolder(task.scope), (_r, scope) =>
        {
            w.log.value("   scope.name", scope.name, 4, logPad);
            w.log.value("   scope.uri.path", scope.uri.path, 4, logPad);
            w.log.value("   scope.uri.fsPath", scope.uri.fsPath, 4, logPad);
        }, this, [ /* User tasks */w.log.value, "   scope.uri.path", "N/A (User)", 4, logPad ], task.scope as WorkspaceFolder);
        w.log.value("   type", definition.type, 4, logPad);
        w.log.value("   relative Path", definition.path ? definition.path : "", 4, logPad);
        if (definition.scriptFile)
        {
            w.log.value("      script file", definition.scriptFile, 4, logPad);
        }
        if (definition.script)
        {
            w.log.value("   script", definition.script, 4, logPad);
        }
        if (definition.target)
        {
            w.log.value("   target", definition.target, 4, logPad);
        }
        if (definition.path)
        {
            w.log.value("   path", definition.path, 4, logPad);
        }
        if (definition.tsconfig)
        {
            w.log.value("   tsconfig", definition.tsconfig, 4, logPad);
        }
        //
        // Internal task providers will set a fileName property
        //
        if (definition.fileName)
        {
            w.log.value("   file name", definition.fileName, 4, logPad);
        }
        //
        // Internal task providers will set a uri property
        //
        if (definition.uri)
        {
            w.log.value("   file path", definition.uri.fsPath, 4, logPad);
        }
        //
        // Script task providers will set a takesArgs property
        //
        if (definition.takesArgs)
        {
            w.log.value("   requires args", definition.takesArgs, 4, logPad);
        }
        if (definition.cmdLine)
        {
            w.log.value("   cmd line", definition.cmdLine, 4, logPad);
        }
        //
        // External task providers can set a icon/iconDark property
        //
        /* istanbul ignore if */
        if (definition.icon)
        {
            w.log.value("   icon", definition.icon, 4, logPad);
        }
        //
        // External task providers can set a icon/iconDark property
        //
        /* istanbul ignore if */
        if (definition.iconDark)
        {
            w.log.value("   icon dark", definition.iconDark, 4, logPad);
        }
        w.log.write("Task Details Done", 3, logPad);
    };


    toTaskItem =  (taskItem: TaskItem | ITeTask | Uri): TaskItem =>
    {
        if (taskItem instanceof Uri) // FileExplorer Context menu
        {
            const uri = taskItem;
            taskItem = Object.values(this._taskMap).find(
                (i) =>  !!i && !!i.resourceUri && i.resourceUri.fsPath === uri.fsPath
            ) as TaskItem;
            void this.wrapper.treeManager.views.taskExplorer.view.reveal(taskItem, { select: false });
        }
        else if (!(taskItem instanceof TaskItem)) // ITeTask (Webview app)
        {
            taskItem = this._taskMap[<string>taskItem.definition.taskItemId];
        }
        return taskItem;
    };

}

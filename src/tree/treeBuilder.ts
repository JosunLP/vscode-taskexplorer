
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

    private readonly _taskFolders: TaskFolder[];
    private readonly _treeGrouper: TaskTreeGrouper;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._taskMap = {};
        this._taskFileMap = {};
        this._taskFolders = [];
        this._taskFolderMap = {};
        this._treeGrouper = new TaskTreeGrouper(wrapper);
    }


    get taskMap() { return this._taskMap; }

    get taskFolders() { return this._taskFolders; }


    private buildTaskTree = async (task: Task, logPad: string): Promise<void> =>
    {
        this.wrapper.log.methodStart("build task tree list", 2, logPad, true, [
            [ "name", task.name ], [ "source", task.source ], [ "definition type", task.definition.type ],
            [ "definition path", task.definition.path ], [ "scope", task.scope ]
        ]);
        let folder: TaskFolder | undefined,
            scopeName: string;
        const relativePath = this.wrapper.pathUtils.getTaskRelativePath(task);
        //
        // Set scope name and create the TaskFolder, a "user" task will have a TaskScope scope, not
        // a WorkspaceFolder scope.
        //
        if (this.wrapper.typeUtils.isWorkspaceFolder(task.scope))
        {
            scopeName = task.scope.name;
            folder = this._taskFolderMap[scopeName];
            if (!folder)
            {
                const key = this.wrapper.utils.lowerCaseFirstChar(scopeName, true),
                      state = this.wrapper.config.get<"Collapsed"|"Expanded">(`${this.wrapper.keys.Config.SpecialFoldersFolderState}.${key}`, "Expanded");
                folder = new TaskFolder(task.scope, TreeItemCollapsibleState[state]);
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
        this.logTask(task, scopeName, logPad + "   ");
        //
        // Get task file node, this will create one of it doesn't exist
        //
        const taskFile = await this.getTaskFile(task, folder, relativePath, logPad + "   ");
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
        const isNpmInstallTask = task.source === "npm" && (task.name === "install" || task.name.startsWith("install - "));
        if (!isNpmInstallTask)
        {
            const fsPath = !task.definition.scriptFile ? taskFile.resourceUri.fsPath : task.definition.uri.fsPath;
            let taskItem = taskFile.treeNodes.find((n): n is TaskItem => n instanceof TaskItem && n.id === TaskItem.getId(fsPath, task));
            if (!taskItem) {
                taskItem = taskFile.addChild(new TaskItem(taskFile, task, logPad + "   "));
            }
            this._taskMap[taskItem.id] = taskItem;
        }
        this.wrapper.log.methodDone("build task tree list", 2, logPad);
    };


    createTaskItemTree = async (rebuild: boolean, logPad: string) =>
    {
        let taskCt = 0;
        const tasks = this.wrapper.treeManager.tasks;
        this.wrapper.log.methodStart("create task tree", 1, logPad);
        this.wrapper.statusBar.update(this.wrapper.keys.Strings.BuildingTaskTree);
        if (rebuild) {
            this.invalidate();
        }
        for (const task of tasks)
        {
            this.wrapper.log.blank(4);
            this.wrapper.log.write(`   Processing task ${++taskCt} of ${ tasks.length} (${task.source})`, 4, logPad);
            await this.buildTaskTree(task, logPad + "   ");
        }
        if (!this.wrapper.typeUtils.isObjectEmpty(this._taskFolderMap))
        {
            if (rebuild) {
                await this._treeGrouper.buildGroupings(this._taskFolderMap, this._taskFileMap, logPad + "   ");
            }
            this._taskFolders.push(...<TaskFolder[]>this.wrapper.sorters.sortFolders(this._taskFolderMap));
        }
        this.wrapper.statusBar.update("");
        this.wrapper.log.methodDone("create task tree", 1, logPad, [[ "current task count", this.wrapper.treeManager.tasks.length ]]);
    };


    private getTaskFile = async (task: Task, folder: TaskFolder, /* groupLevel: number,*/relativePath: string, logPad: string) =>
    {
        let taskFile: TaskFile | undefined;
        this.wrapper.log.methodStart("get task file node", 2, logPad, false, [[ "relative path", relativePath ]]);
        taskFile = this._taskFileMap[TaskFile.id(folder, task, undefined, 0)];
        // if (!taskFile)
        // {
        //     for (let i = 0; i < groupLevel && i < this.wrapper.keys.Numbers.MaxGroupLevel && !taskFile; i++)
        //     {
        //         const fsPath = this.wrapper.pathUtils.getTaskAbsolutePath(task);
        //         taskFile = this._taskFileMap[TaskFile.id(folder, task, undefined, i, TaskFile.groupId(folder, fsPath, task.source, task.name, i))];
        //     }
        // }
        if (!taskFile)
        {
            this.wrapper.log.value("   Add source taskfile container", task.source, 2, logPad);
            taskFile = folder.addChild(new TaskFile(folder, task, relativePath, 0, undefined, task.source, logPad + "   "));
            this._taskFileMap[taskFile.id] = taskFile;
        }
        this.wrapper.log.methodDone("get task file node", 2, logPad);
        return taskFile;
    };


    private invalidate  = () => { this._taskMap = {}; this._taskFileMap = {}; this._taskFolderMap = {}; this._taskFolders.splice(0); };


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
        if (definition.scriptFile) {
            w.log.value("      script file", definition.scriptFile, 4, logPad);
        }
        if (definition.script) {
            w.log.value("   script", definition.script, 4, logPad);
        }
        if (definition.target) {
            w.log.value("   target", definition.target, 4, logPad);
        }
        if (definition.path) {
            w.log.value("   path", definition.path, 4, logPad);
        }
        if (definition.tsconfig) {
            w.log.value("   tsconfig", definition.tsconfig, 4, logPad);
        }
        if (definition.fileName) { // Internal task providers will set a fileName property
            w.log.value("   file name", definition.fileName, 4, logPad);
        }
        if (definition.uri) { // Internal task providers will set a uri property
            w.log.value("   file path", definition.uri.fsPath, 4, logPad);
        }
        if (definition.takesArgs) { // Script task providers will set a takesArgs property
            w.log.value("   requires args", definition.takesArgs, 4, logPad);
        }
        if (definition.cmdLine) {
            w.log.value("   cmd line", definition.cmdLine, 4, logPad);
        }
        w.utils.execIf(definition.icon, () => { // External task providers can set a icon/iconDark property
            w.log.value("   icon", definition.icon, 4, logPad);
        }, this);
        w.utils.execIf(definition.iconDark, () => { // External task providers can set a icon/iconDark property
            w.log.value("   icon dark", definition.iconDark, 4, logPad);
        }, this);
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

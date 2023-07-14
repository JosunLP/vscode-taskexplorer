
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeGrouper } from "./treeGrouper";
import { SpecialTaskFolder } from "./specialFolder";
import { ITeTask, TaskMap, TeTaskSource } from "../interface";
import { Task, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";


export class TaskTreeBuilder
{
    private readonly _taskFolders: TaskFolder[];
    private readonly _taskMap: TaskMap<TaskItem>;
    private readonly _treeGrouper: TaskTreeGrouper;
    private readonly _taskFileMap: TaskMap<TaskFile>;
    private readonly _taskFolderMap: TaskMap<TaskFolder|SpecialTaskFolder>;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._taskMap = {};
        this._taskFileMap = {};
        this._taskFolders = [];
        this._taskFolderMap = {};
        this._treeGrouper = new TaskTreeGrouper(wrapper);
    }


    get taskFolders() { return this._taskFolders; }
    get taskMap() { return this._taskMap; }


    private buildTaskTree = async (task: Task, logPad: string): Promise<void> =>
    {
        const w = this.wrapper;
        w.log.methodStart("build task tree list", 2, logPad, true, [
            [ "name", task.name ], [ "source", task.source ], [ "definition type", task.definition.type ],
            [ "definition path", task.definition.path ], [ "scope", task.scope ]
        ]);
        let folder: TaskFolder | undefined,
            scopeName: string;
        //
        // Set scope name and create the TaskFolder, a "user" task will have a TaskScope scope, not
        // a WorkspaceFolder scope.
        //
        if (w.typeUtils.isWorkspaceFolder(task.scope))
        {
            scopeName = task.scope.name;
            folder = this._taskFolderMap[scopeName];
            if (!folder)
            {
                const key = w.utils.lowerCaseFirstChar(scopeName, true),
                      state = w.config.get<"Collapsed"|"Expanded">(`${w.keys.Config.SpecialFoldersFolderState}.${key}`, "Expanded");
                folder = new TaskFolder(task.scope, TreeItemCollapsibleState[state]);
                this._taskFolderMap[scopeName] = folder;
                w.log.value("constructed tree taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
        }     //
        else // User Task (not related to a ws or project)
        {   //
            scopeName = w.keys.Strings.USER_TASKS_LABEL;
            folder = this._taskFolderMap[scopeName];
            if (!folder)
            {
                const nodeExpandedeMap = w.config.get<Record<string, "Collapsed"|"Expanded">>(w.keys.Config.SpecialFoldersFolderState, {});
                folder = new TaskFolder(scopeName, TreeItemCollapsibleState[nodeExpandedeMap[w.utils.lowerCaseFirstChar(scopeName, true)]]);
                this._taskFolderMap[scopeName] = folder;
                w.log.value("constructed tree user taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
        }
        this.logTask(task, scopeName, logPad + "   ");
        //
        // Get task file node, getTaskFile() will create one of it doesn't exist
        //
        const taskFile = await this.getTaskFile(task, folder, logPad + "   ");
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
            let taskItem = taskFile.treeNodes.find((n): n is TaskItem => TaskItem.is(n) && n.id === TaskItem.id(fsPath, task));
            if (!taskItem) {
                taskItem = taskFile.addChild(new TaskItem(w, taskFile, task, logPad + "   "));
            }
            this._taskMap[taskItem.id] = taskItem;
        }
        w.log.methodDone("build task tree list", 2, logPad);
    };


    createTaskItemTree = async (source: string | undefined, logPad: string) =>
    {
        let taskCt = 0;
        const w = this.wrapper,
              tasks = w.treeManager.tasks.filter(t => !source || source === t.source);
        w.log.methodStart("create task tree", 1, logPad, false, [[ "source", source ], [ "# of tasks", tasks.length ]]);
        w.statusBar.update(w.keys.Strings.BuildingTaskTree);
        this.invalidate(source);
        for (const task of tasks)
        {
            w.log.write(`   create task tree - processing task ${++taskCt} of ${ tasks.length} (${task.source})`, 4, logPad);
            await this.buildTaskTree(task, logPad + "   ");
        }
        if (!w.typeUtils.isObjectEmpty(this._taskFolderMap))
        {
            await this._treeGrouper.buildGroupings(source, this._taskFolderMap, this._taskFileMap, logPad + "   ");
            this._taskFolders.push(...<TaskFolder[]>w.sorters.sortFolders(this._taskFolderMap));
        }
        w.statusBar.update("");
        w.log.methodDone("create task tree", 1, logPad, [[ "task count", w.treeManager.tasks.length ]]);
    };


    private getTaskFile = async (task: Task, folder: TaskFolder, logPad: string) =>
    {
        const w = this.wrapper,
              id = !w.taskUtils.isScriptType(<TeTaskSource>task.source) ?
                    TaskFile.id(folder, task, 0) :
                    // script type files in same dir - place in `one` taskfile
                    TaskFile.groupId(folder, w.pathUtils.getTaskAbsolutePath(task), task.source, task.source, -1);
        if (!this._taskFileMap[id])
        {
            w.log.value("Add source base taskfile container", task.source, 2, logPad);
            this._taskFileMap[id] = folder.addChild(new TaskFile(w, folder, task, 0, undefined, task.source, logPad + "   "));
        }
        return this._taskFileMap[id];
    };


    private invalidate = (source?: string) =>
    {
        this._taskFolders.splice(0);
        if (!source)
        {
            Object.keys(this._taskMap).forEach(k => delete this._taskMap[k], this);
            Object.keys(this._taskFileMap).forEach(k => delete this._taskFileMap[k], this);
            Object.keys(this._taskFolderMap).forEach(k => delete this._taskFolderMap[k], this);
        }
        else {
            this.wrapper.utils.popObjIfExistsBy(this._taskMap, (_k, t) => t.taskSource === source, this);
            this.wrapper.utils.popObjIfExistsBy(this._taskFileMap, (_k, t) => t.taskSource === source, this);
        }
    };


    private logTask = (task: Task, scopeName: string, logPad: string) =>
    {
        const w = this.wrapper,
              definition = task.definition;
        if (!w.log.control.enable) {
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
        w.log.write("Task Details Done", 3, logPad);
    };


    toTaskItem =  (taskItem: TaskItem | ITeTask | Uri): TaskItem =>
    {
        if (taskItem instanceof Uri) // FileExplorer Context menu
        {
            const uri = taskItem;
            taskItem = Object.values(this._taskMap).find(
                (i): i is TaskItem => !!i && !!i.resourceUri && i.resourceUri.fsPath === uri.fsPath
            ) as TaskItem;
            void this.wrapper.treeManager.views.taskExplorer.view.reveal(taskItem, { select: false });
        }
        else if (!TaskItem.is(taskItem)) // ITeTask (Webview app)
        {
            taskItem = this._taskMap[<string>taskItem.definition.taskItemId];
        }
        return taskItem;
    };

}

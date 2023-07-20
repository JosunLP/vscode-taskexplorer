
import { TaskFile } from "./node/file";
import { TaskItem } from "./node/item";
import { TaskFolder } from "./node/folder";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeGrouper } from "./grouper";
import { ITeTask, TaskMap, TeTaskSource } from "../interface";
import { Task, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";
import { ProjectTaskFolder } from "./node/projectFolder";


export class TaskTreeBuilder
{
    private readonly _taskFolders: TaskFolder[];
    private readonly _taskMap: TaskMap<TaskItem>;
    private readonly _treeGrouper: TaskTreeGrouper;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._taskMap = {};
        this._taskFolders = [];
        this._treeGrouper = new TaskTreeGrouper(wrapper);
    }


    get taskFolders() { return this._taskFolders; }

    get taskMap() { return this._taskMap; }


    private buildFolders = (task: Task, map: TaskMap<TaskFile>, logPad: string): void =>
    {   //
        // Create and add task item to task file node
        // If this is an 'NPM Install' task, then we do not add a tree item
        //
        if (task.source === "npm" && (task.name === "install" || task.name.startsWith("install - "))) {
            return;
        }
        const w = this.wrapper,
                callPad = logPad + "   ",
                folderStateKey = w.keys.Config.SpecialFoldersFolderState;
        let   folder: TaskFolder | undefined,
                scope: WorkspaceFolder | string,
                scopeName: string;
        w.log.methodStart("build task tree list", 3, logPad);
        //
        // Set scope name and create the TaskFolder if it doesn't already exist, a "user" task
        // will have a `TaskScope` scope, not a `WorkspaceFolder` scope.
        //
        if (w.typeUtils.isWorkspaceFolder(task.scope))
        {
            scope = task.scope;
            scopeName = task.scope.name;
        }     //
        else // User Task (not related to a ws or project)
        {   //
            scope = scopeName = w.keys.Strings.USER_TASKS_LABEL;
        }
        folder = this._taskFolders.find(f => f.label === scopeName);
        if (!folder)
        {
            const key = w.utils.lowerCaseFirstChar(scopeName, true),
                    state = w.config.get<"Collapsed"|"Expanded">(`${folderStateKey}.${key}`, "Expanded");
            folder = new TaskFolder(scope, TreeItemCollapsibleState[state]);
            w.log.value("add new taskfolder", `${scopeName} (${folder.id})`, 3, callPad);
            this._taskFolders.push(folder);
        }
        this.logTask(task, scopeName, callPad);
        const taskFile = this.getTaskFile(task, folder, map, callPad), // will create and add to folder if needed
              taskItem = taskFile.addChild(new TaskItem(w, taskFile, task, callPad));
        this._taskMap[taskItem.id] = taskItem;
        w.log.methodDone("build task tree list", 3, logPad);
    };


    createTaskItemTree = (source: string | undefined, logPad: string) =>
    {
        const w = this.wrapper,
              map: TaskMap<TaskFile> = {},
              tasks = !source ? w.treeManager.tasks : w.treeManager.tasks.filter(t => source === t.source);
        let   taskCt = 0;
        w.log.methodStart("create task tree", 2, logPad, false, [[ "source", source ], [ "# of tasks", tasks.length ]]);
        w.statusBar.update(w.keys.Strings.BuildingTaskTree);
        this.invalidate(source);
        for (const task of tasks)
        {
            w.log.write(`   create task tree - processing task ${++taskCt} of ${ tasks.length} (${task.source})`, 4, logPad);
            this.buildFolders(task, map, logPad + "   ");
        }
        w.utils.popIfExistsBy(this._taskFolders, f => !f.isSpecial && f.treeNodes.length === 0);
        // const projectFolders = this._taskFolders.filter(f => !f.isSpecial);
        // if (projectFolders.length === 0)
        // {
        //     this._taskFolders.splice(0);
        // }
        w.treeManager.sorter.sortFolders(this._taskFolders);
        const modFolders = this._taskFolders.filter(
            (f): f is ProjectTaskFolder => !f.isSpecial && !!(!source || f.treeNodes.find(n => n.taskSource === source))
        );
        if (modFolders.length > 0)
        {
            this._treeGrouper.buildGroupings(source, modFolders, logPad + "   ");
            w.treeManager.sorter.sortFolders(this._taskFolders);
        }
        w.statusBar.update("");
        w.log.methodDone("create task tree", 2, logPad, [[ "task count", w.treeManager.tasks.length ]]);
    };


    private getTaskFile = (task: Task, folder: TaskFolder, map: TaskMap<TaskFile>, logPad: string) =>
    {
        const w = this.wrapper,
              absTaskPath = w.pathUtils.getTaskAbsolutePath(task),
              //
              // Use groupId for `script` type files so that they are rooted under the same taskfile node
              //
              isScriptType = w.taskUtils.isScriptType(<TeTaskSource>task.source),
              id = !isScriptType ? TaskFile.id(folder, task, 0) :
                                   TaskFile.groupId(folder, absTaskPath, task.source, task.source, 0);
        w.log.write(`Add ${task.source} non-grouped task container`, 2, logPad);
        if (!map[id])
        {
            map[id] = folder.addChild(new TaskFile(w, folder, task, 0, undefined, task.source, logPad));
        }
        return map[id];
    };


    private invalidate = (source?: string) =>
    {
        if (!source)
        {
            Object.keys(this._taskMap).forEach(k => { delete this._taskMap[k]; }, this);
            this._taskFolders.filter(f => !f.isSpecial).forEach(f => f.treeNodes.splice(0));
        }
        else {
            this.wrapper.utils.popObjIfExistsBy(this._taskMap, (_k, t) => t.taskSource === source, this);
            this._taskFolders.forEach(f => { if (!f.isSpecial) this.wrapper.utils.popIfExistsBy(f.treeNodes, n => n.taskSource === source); }, this);
        }
        // this.wrapper.utils.popIfExistsBy(this._taskFolders, f => !f.isSpecial && f.treeNodes.length === 0);
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


    removeFolder = (uri: Uri) =>
    {
        this.wrapper.utils.popObjIfExistsBy(this._taskMap, (_, i) => !!i && (i.uri.fsPath.startsWith(uri.fsPath)), this);
        this.wrapper.utils.popIfExistsBy(this._taskFolders, (f) => !f.isSpecial && !!f.uri && f.uri.fsPath.startsWith(uri.fsPath), this, true);
    };


    toTaskItem =  (taskItem: TaskItem | ITeTask | Uri): TaskItem =>
    {
        if (taskItem instanceof Uri) // If type Uri, the call comes from a context menu
        {
            const uri = taskItem;
            taskItem = <TaskItem>Object.values(this._taskMap).find(i => i.uri.fsPath === uri.fsPath);
            //
            // TODO - Check - 7/17/23 - pre-v3 - Must have put this reveal() here for a reason
            //
            void this.wrapper.treeManager.views.taskExplorer.view.reveal(taskItem, { select: false });
        }
        else if (!TaskItem.is(taskItem)) // If type `ITeTask`, the call comes from a webview
        {
            taskItem = this._taskMap[<string>taskItem.definition.taskItemId];
        }
        return taskItem;
    };

}

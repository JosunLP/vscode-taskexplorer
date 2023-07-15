
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeGrouper } from "./treeGrouper";
import { ITeTask, TaskMap, TeTaskSource } from "../interface";
import { Task, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";


export class TaskTreeBuilder
{
    private _buildStamp: number;

    private readonly _taskFolders: TaskFolder[];
    private readonly _taskMap: TaskMap<TaskItem>;
    private readonly _treeGrouper: TaskTreeGrouper;
    private readonly _taskFileMap: TaskMap<TaskFile>;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._buildStamp = 0;
        this._taskMap = {};
        this._taskFileMap = {};
        this._taskFolders = [];
        this._treeGrouper = new TaskTreeGrouper(wrapper);
    }


    get taskFolders() { return this._taskFolders; }
    get taskMap() { return this._taskMap; }


    private buildTaskTree = (task: Task, logPad: string): void =>
    {
        const w = this.wrapper;
        w.log.methodStart("build task tree list", 3, logPad, true, [
            [ "name", task.name ], [ "source", task.source ], [ "definition type", task.definition.type ],
            [ "definition path", task.definition.path ]
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
            folder = this._taskFolders.find(f => f.label === scopeName);
            if (!folder)
            {
                const key = w.utils.lowerCaseFirstChar(scopeName, true),
                      state = w.config.get<"Collapsed"|"Expanded">(`${w.keys.Config.SpecialFoldersFolderState}.${key}`, "Expanded");
                folder = new TaskFolder(task.scope, this._buildStamp, TreeItemCollapsibleState[state]);
                this._taskFolders.push(folder);
                w.log.value("constructed tree taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
            else {
                folder.stamp = this._buildStamp;
            }
        }     //
        else // User Task (not related to a ws or project)
        {   //
            scopeName = w.keys.Strings.USER_TASKS_LABEL;
            folder = this._taskFolders.find(f => f.label === scopeName);
            if (!folder)
            {
                const nodeExpandedeMap = w.config.get<Record<string, "Collapsed"|"Expanded">>(w.keys.Config.SpecialFoldersFolderState, {});
                folder = new TaskFolder(scopeName, this._buildStamp, TreeItemCollapsibleState[nodeExpandedeMap[w.utils.lowerCaseFirstChar(scopeName, true)]]);
                this._taskFolders.push(folder);
                w.log.value("constructed tree user taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
            else {
                folder.stamp = this._buildStamp;
            }
        }
        this.logTask(task, scopeName, logPad + "   ");
        //
        // Get task file node, getTaskFile() will create one of it doesn't exist
        //
        const taskFile = this.getTaskFile(task, folder, logPad + "   ");
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
            const taskItem = taskFile.addChild(new TaskItem(w, taskFile, task, this._buildStamp, logPad + "   "));
            taskItem.stamp = this._buildStamp;
            this._taskMap[taskItem.id] = taskItem;
        }
        w.log.methodDone("build task tree list", 3, logPad);
    };


    createTaskItemTree = (source: string | undefined, logPad: string) =>
    {
        let taskCt = 0;
        const w = this.wrapper,
              tasks = w.treeManager.tasks.filter(t => !source || source === t.source);
        w.log.methodStart("create task tree", 2, logPad, false, [[ "source", source ], [ "# of tasks", tasks.length ]]);
        w.statusBar.update(w.keys.Strings.BuildingTaskTree);
        this.invalidate(source);
        this._buildStamp = Date.now();
        for (const task of tasks)
        {
            w.log.write(`   create task tree - processing task ${++taskCt} of ${ tasks.length} (${task.source})`, 4, logPad);
            this.buildTaskTree(task, logPad + "   ");
        }
        w.utils.popIfExistsBy(this._taskFolders, f => !f.isSpecial && f.treeNodes.length === 0);
        const projectFolders = this._taskFolders.filter(f => !f.isSpecial);
        if (projectFolders.length === 0)
        {
            this._taskFolders.splice(0);
        }
        const modFolders = projectFolders.filter(f => !source || !!f.treeNodes.find(n => n.taskSource === source));
        if (modFolders.length > 0) {
            w.treeManager.sorter.sortFolders(this._taskFolders);
            this._treeGrouper.buildGroupings(source, this._taskFolders, this._taskFileMap, logPad + "   ");
        }
        w.statusBar.update("");
        w.log.methodDone("create task tree", 2, logPad, [[ "task count", w.treeManager.tasks.length ]]);
    };


    private getTaskFile = (task: Task, folder: TaskFolder, logPad: string) =>
    {
        const w = this.wrapper,
              id = !w.taskUtils.isScriptType(<TeTaskSource>task.source) ?
                    TaskFile.id(folder, task, 0) :
                    // script type files in same dir - place in `one` taskfile
                    TaskFile.groupId(folder, w.pathUtils.getTaskAbsolutePath(task), task.source, task.source, -1);
        if (!this._taskFileMap[id])
        {
            w.log.value("Add source base taskfile container", task.source, 2, logPad);
            this._taskFileMap[id] = folder.addChild(
                new TaskFile(w, folder, task, 0, undefined, task.source, this._buildStamp, logPad + "   ")
            );
        }
        else {
            folder.stamp = this._buildStamp;
        }
        return this._taskFileMap[id];
    };


    private invalidate = (source?: string) =>
    {
        if (!source)
        {
            this._taskFolders.forEach(f => f.treeNodes.splice(0));
            Object.keys(this._taskMap).forEach(k => delete this._taskMap[k], this);
            Object.keys(this._taskFileMap).forEach(k => delete this._taskFileMap[k], this);
        }
        else {
            this._taskFolders.forEach(f => this.wrapper.utils.popIfExistsBy(f.treeNodes, n => n.taskSource === source));
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


    removeFolder = (uri: Uri) =>
    {
        this.wrapper.utils.popObjIfExistsBy(this._taskMap, (_, i) => !!i && (i.resourceUri.fsPath.startsWith(uri.fsPath)), this);
        this.wrapper.utils.popIfExistsBy(
            this._taskFolders,
            f => !!f.resourceUri && f.resourceUri.fsPath === uri.fsPath, // Exclude special folders (do not have a resourceUri)
            this, true // single pop
        );
    };


    toTaskItem =  (taskItem: TaskItem | ITeTask | Uri): TaskItem =>
    {
        if (taskItem instanceof Uri) // FileExplorer Context menu
        {
            const uri = taskItem;
            taskItem = <TaskItem>Object.values(this._taskMap).find(i => i.resourceUri.fsPath === uri.fsPath);
            void this.wrapper.treeManager.views.taskExplorer.view.reveal(taskItem, { select: false });
        }
        else if (!TaskItem.is(taskItem)) // ITeTask (Webview app)
        {
            taskItem = this._taskMap[<string>taskItem.definition.taskItemId];
        }
        return taskItem;
    };

}

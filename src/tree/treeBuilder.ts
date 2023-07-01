
import { join } from "path";
import { TaskFile } from "./file";
import { TaskItem } from "./item";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeGrouper } from "./treeGrouper";
import { IDictionary, TaskMap } from "../interface";
import { Task, TreeItemCollapsibleState, WorkspaceFolder } from "vscode";


export class TaskTreeBuilder
{
    private taskMap: TaskMap = {};
    private taskTree: TaskFolder[] | undefined | null | void = null;
    private readonly _treeGrouper: TaskTreeGrouper;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._treeGrouper = new TaskTreeGrouper(wrapper);
    }


    private buildTaskItemTree = async(logPad: string, logLevel: number): Promise<TaskFolder[]> =>
    {
        let taskCt = 0;
        const folders: IDictionary<TaskFolder> = {};
        const files: IDictionary<TaskFile> = {};
        let sortedFolders: TaskFolder[];
        const tasks = this.wrapper.treeManager.getTasks();

        this.wrapper.log.methodStart("build task tree", logLevel, logPad);

        //
        // Loop through each task provided by the engine and build a task tree
        //
        for (const each of tasks)
        {
            this.wrapper.log.blank(logLevel + 1);
            this.wrapper.log.write(`   Processing task ${++taskCt} of ${ tasks.length} (${each.source})`, logLevel + 1, logPad);
            await this.buildTaskTreeList(each, folders, files, logPad + "   ");
        }

        if (!this.wrapper.typeUtils.isObjectEmpty(folders))
        {   //
            // Sort and build groupings
            //
            await this._treeGrouper.buildGroupings(folders, logPad + "   ", logLevel);
            //
            // Get sorted root project folders - only project folders are sorted, special folders 'Favorites',
            // 'User Tasks' and 'Last Tasks' are kept at the top of the list.
            //
            sortedFolders = this.wrapper.sorters.sortFolders(folders) as TaskFolder[];
        }     //
        else // If 'folders' is an empty map, or, all tasks are disabled but Workspace+NPM (and Gulp+Grunt
        {   // if their respective 'autoDetect' settings are `on`) tasks are returned in fetchTasks() since
            // they are internally provided, and we ignored them in buildTaskTreeList().
            //
            sortedFolders = [];
        }

        //
        // Done!
        //
        this.wrapper.log.methodDone("build task tree", logLevel, logPad);

        return sortedFolders;
    };


    /**
     * @method buildTaskTreeList
     *
     * @param each The Task that the tree item to be created will represent.
     * @param folders The map of existing TaskFolder items.  TaskFolder items represent workspace folders.
     * @param files The map of existing TaskFile items.
     * @param ltFolder The TaskFolder representing "Last Tasks"
     * @param favFolder The TaskFolder representing "Favorites"
     * @param lastTasks List of Task ID's currently in the "Last Tasks" TaskFolder.
     * @param favTasks List of Task ID's currently in the "Favorites" TaskFolder.
     * @param logPad Padding to prepend to log entries.  Should be a string of any # of space characters.
     */
    private buildTaskTreeList = async(each: Task, folders: IDictionary<TaskFolder>, files: IDictionary<TaskFile>, logPad: string) =>
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
            folder = folders[scopeName];
            if (!folder)
            {
                const key = this.wrapper.utils.lowerCaseFirstChar(scopeName, true),
                      state = this.wrapper.config.get<"Collapsed"|"Expanded">(`${this.wrapper.keys.Config.SpecialFoldersFolderState}.${key}`, "Expanded");
                folder = new TaskFolder(each.scope, TreeItemCollapsibleState[state]);
                folders[scopeName] = folder;
                this.wrapper.log.value("constructed tree taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
        }     //
        else // User Task (not related to a ws or project)
        {   //
            scopeName = this.wrapper.keys.Strings.USER_TASKS_LABEL;
            folder = folders[scopeName];
            if (!folder)
            {
                const nodeExpandedeMap = this.wrapper.config.get<IDictionary<"Collapsed"|"Expanded">>(this.wrapper.keys.Config.SpecialFoldersFolderState);
                folder = new TaskFolder(scopeName, TreeItemCollapsibleState[nodeExpandedeMap[this.wrapper.utils.lowerCaseFirstChar(scopeName, true)]]);
                folders[scopeName] = folder;
                this.wrapper.log.value("constructed tree user taskfolder", `${scopeName} (${folder.id})`, 3, logPad + "   ");
            }
        }

        //
        // Log the task details
        //
        this.logTask(each, scopeName, logPad + "   ");

        //
        // Get task file node, this will create one of it doesn't exist
        //
        const taskFile = await this.getTaskFileNode(each, folder, files, relativePath, scopeName, logPad + "   ");

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
            const taskItem = new TaskItem(taskFile, each, logPad + "   ");
            taskFile.addTreeNode(taskItem);
            this.taskMap[taskItem.id] = taskItem;
        }

        this.wrapper.log.methodDone("build task tree list", 2, logPad);
    };


    createTaskItemTree = async(logPad: string, logLevel: number) =>
    {
        this.wrapper.log.methodStart("create task tree", logLevel, logPad);
        this.wrapper.statusBar.update("Building task explorer tree");
        this.taskTree = await this.buildTaskItemTree(logPad + "   ", logLevel + 1);
        this.wrapper.statusBar.update("");
        this.wrapper.log.methodDone("create task tree", logLevel, logPad, [[ "current task count", this.wrapper.treeManager.getTasks().length ]]);
    };


    private getTaskFileNode = async(task: Task, folder: TaskFolder, files: IDictionary<TaskFile>, relativePath: string, scopeName: string, logPad: string) =>
    {
        let taskFile: TaskFile;
        this.wrapper.log.methodStart("get task file node", 2, logPad, false, [[ "relative path", relativePath ], [ "scope name", scopeName ]]);

        //
        // Reference ticket #133, vscode folder should not use a path appenditure in it's folder label
        // in the task tree, there is only one path for vscode/workspace tasks, /.vscode.  The fact that
        // you can set the path variable inside a vscode task changes the relativePath for the task,
        // causing an endless loop when putting the tasks into groups (see taskTree.createTaskGroupings).
        // All other task types will have a relative path of it's location on the filesystem (with
        // exception of TSC, which is handled elsewhere).
        //
        const relPathAdj = task.source !== "Workspace" ? relativePath : ".vscode";

        let id = task.source + ":" + join(scopeName, relPathAdj);
        if (task.definition.fileName && !task.definition.scriptFile)
        {
            id = join(id, task.definition.fileName);
        }

        taskFile = files[id];

        if (!taskFile) // Create taskfile node if needed
        {
            this.wrapper.log.value("   Add source file container", task.source, 2, logPad);
            taskFile = new TaskFile(folder, task.definition, task.source, relativePath, 0, undefined, undefined, logPad + "   ");
            folder.addTaskFile(taskFile);
            files[id] = taskFile;
        }

        this.wrapper.log.methodDone("get task file node", 2, logPad);
        return taskFile;
    };


    getTaskMap = () => this.taskMap;


    getTaskTree = () => this.taskTree;


    invalidate  = () => { this.taskMap = {}; this.taskTree = null; };


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

}

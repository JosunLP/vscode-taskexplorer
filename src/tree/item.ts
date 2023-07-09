
import { join } from "path";
import { TaskFile } from "./file";
import { TaskFolder } from "./folder";
import { ITaskItem, TeTaskSource } from "../interface";
import { encodeUtf8Hex } from ":env/hex";
import { Strings } from "../lib/constants";
import { configuration } from "../lib/configuration";
import { getInstallPathSync } from "../lib/utils/pathUtils";
import { getTaskTypeFriendlyName } from "../lib/utils/taskUtils";
import {
    Task, TaskExecution, TreeItem, TreeItemCollapsibleState, WorkspaceFolder, tasks, Command, Uri
} from "vscode";


export class TaskItem extends TreeItem implements ITaskItem
{
    declare label: string;
    override id: string;
    override command: Command;
    override resourceUri: Uri;

    private _paused: boolean;
    private _groupLevel: number;
    private _folder: TaskFolder;
    private _taskDetached: Task | undefined;
    private _execution: TaskExecution | undefined;

    private readonly _task: Task;
    private readonly _taskFile: TaskFile;
    private readonly _taskSource: TeTaskSource;
    // private readonly _taskType: string;
    // private readonly _relativePath: string;
    private readonly _isUser: boolean;


    constructor(taskFile: TaskFile, task: Task, logPad: string)
    {
        const taskDef = task.definition;
        const getDisplayName = (taskName: string): string =>
        {
            let displayName = taskName;
            if (displayName.includes(" - ") && (displayName.includes("/") || displayName.includes("\\") ||
                                                displayName.includes(" - tsconfig.json")))
            {
                displayName = task.name.substring(0, taskName.indexOf(" - "));
            }
            return displayName;
        };
        super(getDisplayName(task.name), TreeItemCollapsibleState.None);
        //
        // Since we save tasks (last tasks and favorites), we need a known unique key to
        // save them with.  We can just use the existing id parameter...
        // 'Script' type tasks will set the file 'uri' and the 'scriptFile' flag on the task definition
        //
        const fsPath = !task.definition.scriptFile ? taskFile.resourceUri.fsPath : task.definition.uri.fsPath;
        if (task.definition.scriptFile) {
            this.resourceUri = Uri.file(fsPath);
        }
        else {
            this.resourceUri = taskFile.resourceUri;
        }
        //
        // Set ID and properties
        //
        this.id = TaskItem.id(fsPath, task);
        this._folder = taskFile.folder;
        this._task = task;
        this._task.definition.taskItemId = this.id; // Used in task start/stop events, see TaskWatcher
        // this._relativePath = taskFile.relativePath;
        this._taskSource = <TeTaskSource>task.source;
        // this._taskType = task.definition.type;   // If the source is `Workspace`, def.type can be of any provider type
        this._isUser = taskFile.isUser;
        this._paused = false;                       // paused flag used by start/stop/pause task functionality
        this._taskFile = taskFile;
        this._groupLevel = 0;                       // Grouping level - will get set by treefile.addTreeNode()
        this.command = {
            title: "Open definition",               // Default click action is just Open file since it's easy to click on accident
            command: "taskexplorer.open",
            arguments: [ this, true ]
        };
        //
        // Tooltip
        //
        const taskName = getTaskTypeFriendlyName(task.source, true);
        this.tooltip = "Open " + task.name + (task.detail ? ` | ${task.detail}` : "") +
                        `   source : \`${taskName}\``;
        if (task.definition.type !== task.source) {
            this.tooltip += `   type   : \`${task.definition.type}\``;
        }
        //
        // Refresh state - sets context value, icon path from execution state
        //
        this.refreshState(logPad + "   ", 5);
    }


    get execution() { return this._execution; };

    get folder() { return this._folder; };

    set folder(v) { this._folder = v; }

    get groupLevel() { return this._groupLevel; };

    set groupLevel(v) { this._groupLevel = v; }

    get taskDetached() { return this._taskDetached; };

    set taskDetached(v) { this._taskDetached = v; };

    get isUser() { return this._isUser; };

    get paused() { return this._paused; };

    set paused(v) { this._paused = v; };

    get task() { return this._task; };

    get taskFile() { return this._taskFile; };

    get taskSource() { return this._taskSource; };


    static id(fsPath: string, task: Task)
    {
        return encodeUtf8Hex(`${fsPath}:${task.source}:${task.definition.type}:${task.name}`);
    }


    getFolder(): WorkspaceFolder | undefined { return this._taskFile.folder.workspaceFolder; }


    isExecuting(logPad = "   ")
    {
        const task = this._taskDetached ?? this.task;
        const execs = tasks.taskExecutions.filter(e => e.task.name === task.name && e.task.source === task.source &&
                                                e.task.scope === task.scope && e.task.definition.path === task.definition.path);
        const exec = execs.find(e => e.task.name === task.name && e.task.source === task.source &&
                                e.task.scope === task.scope && e.task.definition.path === task.definition.path);
        return exec;
    }


    private isSpecial() { return this.id.includes("::") || this.id.includes(Strings.USER_TASKS_LABEL + ":"); }


    refreshState(logPad: string, logLevel: number)
    {
        const isExecuting = !!this.isExecuting();
        this.setContextValue(this.task, isExecuting);
        this.setIconPath(isExecuting);
    }


    private setContextValue(task: Task, running: boolean)
    {   //
        // Context view controls the view parameters to the ui, see package.json /views/context node.
        //
        //     script        - Standard task item, e.g. "npm", "Workspace", "gulp", etc
        //     scriptFile    - A file that is ran as a task, ie. "batch" or "bash", i.e. script type "script".
        //     scriptRunning - Obviously, a task/script that is running.
        //
        //     scriptS        - Same as above, but for a TaskItem in the Fav/LastTasks folder
        //     scriptFileS    - Same as above, but for a TaskItem in the Fav/LastTasks folder
        //     scriptRunningS - Same as above, but for a TaskItem in the Fav/LastTasks folder
        //
        // Note that TaskItems of type 'scriptFile' can be ran with arguments and this will have an additional
        // entry added to it's context menu - "Run with arguments"
        //
        if (this.isSpecial())
        {
            if (task.definition.scriptFile || this.taskSource === "gradle") {
                this.contextValue = running ? "scriptRunningS" : "scriptFileS";
            }
            else {
                this.contextValue = running ? "scriptRunningS" : "scriptS";
            }
        }
        else
        {
            if (task.definition.scriptFile || this.taskSource === "gradle") {
                this.contextValue = running ? "scriptRunning" : "scriptFile";
            }
            else {
                this.contextValue = running ? "scriptRunning" : "script";
            }
        }
    }


    private setIconPath(running: boolean)
    {   //
        // Type "$empty" is a composite tasks
        //
        const installPath = getInstallPathSync();
        if (running) // && task.definition.type !== "$empty")
        {
            const disableAnimated = configuration.get<boolean>("visual.disableAnimatedIcons");
            this.iconPath = {
                light: join(installPath, "res", "img", "light", !disableAnimated ? "loading.svg" : "loadingna.svg"),
                dark: join(installPath, "res", "img", "dark", !disableAnimated ? "loading.svg" : "loadingna.svg")
            };
        }
        else
        {
            this.iconPath = {
                light: join(installPath, "res", "img", "light", "script.svg"),
                dark: join(installPath, "res", "img", "dark", "script.svg")
            };
        }
    }

}

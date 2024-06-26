
import { join, sep } from "path";
import { TaskFile } from "./file";
import { TaskFolder } from "./folder";
import { TaskTreeNode } from "./base";
import { encodeUtf8Hex } from ":env/hex";
import { TeWrapper } from "../../lib/wrapper";
import { ITaskItem, MarkdownChars, TeTaskSource } from "../../interface";
import { Task, TaskExecution, TreeItemCollapsibleState, WorkspaceFolder, tasks, Command, Uri, MarkdownString, ShellExecution } from "vscode";


export class TaskItem extends TaskTreeNode implements ITaskItem
{
    override command: Command;

    private _paused: boolean;
    private _groupLevel: number;
    private _folder: TaskFolder;
    private _taskDetached: Task | undefined;
    private _execution: TaskExecution | undefined;

    private readonly _uri: Uri;
    private readonly _task: Task;
    private readonly _taskFile: TaskFile;
    private readonly _taskSource: TeTaskSource;
    private readonly _isUser: boolean;


    constructor(private readonly wrapper: TeWrapper, taskFile: TaskFile, task: Task, logPad: string)
    {
        super((() =>
        {
            let displayName = task.name;
            if (task.source === "tsc" && task.name.includes(" - "))
            {
                const match = task.definition.tsconfig.match(wrapper.keys.Regex.TsConfigFileName);
                displayName = task.name.substring(0, task.name.indexOf(" - ")) + (match ? ` (${match[1]})` : "");
            }
            return displayName;
        })(), TreeItemCollapsibleState.None);
        //
        const taskDef = task.definition;
        wrapper.log.methodStart("create taskitem node", 5, logPad, false, [
            [ "label", this.label ], [ "source", taskFile.taskSource ], [ "task file", taskFile.label ],
            [ "groupLevel", taskFile.groupLevel ], [ "taskDef cmd line", taskDef.cmdLine ],
            [ "taskDef file name", taskDef.fileName ], [ "taskDef icon light", taskDef.icon ], [ "taskDef icon dark", taskDef.iconDark ],
            [ "taskDef script", taskDef.script ], [ "taskDef target", taskDef.target ], [ "taskDef path", taskDef.path ]
        ]);
        //
        // Set ID and properties
        //
        this._uri = task.definition.uri || taskFile.uri;
        this.id = TaskItem.id(this._uri.fsPath, task);
        this._task = task;
        this._folder = taskFile.folder;
        this._taskSource = <TeTaskSource>task.source;
        this._isUser = taskFile.isUser;             // User task not related to a project/workspace folder
        this._paused = false;                       // paused flag used by start/stop/pause task functionality
        this._taskFile = taskFile;
        this._groupLevel = 0;                       // Grouping level - may be re-set by treefile.addTreeNode()
        this.command = {
            title: "Open definition",               // Default click action is just Open file since it's easy to click on accident
            command: "taskexplorer.open",
            arguments: [ this, true ]
        };
        //
        // Copy some properties to the task definition
        //
        taskDef.taskItemId = this.id ;              // Used in task start/stop events, see TaskWatcher
        taskDef.taskFileId = taskFile.id ;          // Used in task start/stop events, see TaskWatcher
        taskDef.fileName = taskFile.fileName ;
        taskDef.relativePath = taskFile.relativePath;
        taskDef.absolutePath = this._uri.fsPath;
        taskDef.uri = this._uri;
        //
        // Tooltip
        //
        let tooltip = `Open task ${MarkdownChars.Italic}${task.name}${MarkdownChars.Italic}${MarkdownChars.NewLine}`;
        tooltip += `source: ${MarkdownChars.Block}${task.source}${MarkdownChars.Block}`;
        if (task.execution instanceof ShellExecution)
        {
            tooltip += `${MarkdownChars.NewLine}${MarkdownChars.Code}${task.execution.commandLine || task.execution.command}`;
            if (task.execution.args.length > 0) {
                tooltip += ` ${task.execution.args.join(" ")}`;
            }
        }
        tooltip += `${MarkdownChars.NewLine}file: ${taskDef.fileName}`;
        tooltip += `${MarkdownChars.NewLine}path: ${taskDef.relativePath || sep}`;
        tooltip += `${MarkdownChars.NewLine}loc: ${taskDef.absolutePath}`;
        if (task.source !== taskDef.type && task.source !== "tsc")
        {
            tooltip += `${MarkdownChars.NewLine}This ${wrapper.taskUtils.getTaskTypeFriendlyName(task.source, true)} ` +
                       `task is of type ${MarkdownChars.Block}${taskDef.type}${MarkdownChars.Block}`;
        }
        this.tooltip = new MarkdownString(tooltip);
        //
        // Refresh state - sets context value, icon path from execution state
        //
        this.refreshState();
        wrapper.log.methodDone("create taskitem node", 5, logPad, [
            [ "id", this.id ], [ "label", this.label ], [ "is usertask", this._isUser ],
            [ "context value", this.contextValue ], [ "groupLevel", this._groupLevel ],
            [ "absolute path", taskDef.absolutePath ], [ "relative path", taskDef.relativePath  ]
        ]);
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
    get uri() { return this._uri; };


    getFolder(): WorkspaceFolder | undefined { return this._taskFile.folder.workspaceFolder; }


    static id(fsPath: string, task: Task)
    {
        return encodeUtf8Hex(`${fsPath}:${task.source}:${task.definition.type}:${task.name}`);
    }


    static is(item: any): item is TaskItem { return item instanceof TaskItem ; }


    isExecuting()
    {
        const task = this._taskDetached ?? this.task;
        const execs = tasks.taskExecutions.filter(e => e.task.name === task.name && e.task.source === task.source &&
                                                e.task.scope === task.scope && e.task.definition.path === task.definition.path);
        const exec = execs.find(e => e.task.name === task.name && e.task.source === task.source &&
                                e.task.scope === task.scope && e.task.definition.path === task.definition.path);
        return exec;
    }


    private isSpecial() { return this.id.includes("::") || this.id.includes(this.wrapper.keys.Strings.USER_TASKS_LABEL + ":"); }


    refreshState()
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
        const installPath = this.wrapper.pathUtils.getInstallPathSync();
        if (running) // && task.definition.type !== "$empty")
        {
            const disableAnimated = this.wrapper.config.get<boolean>("visual.disableAnimatedIcons");
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

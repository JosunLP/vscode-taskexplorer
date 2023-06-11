
import { dirname } from "path";
import { TaskFile } from "../tree/file";
import { TaskItem } from "../tree/item";
import { TeWrapper } from "../lib/wrapper";
import { pathExists } from "../lib/utils/fs";
import { PinnedStorageKey } from "../lib/constants";
import { isScriptType } from "../lib/utils/taskUtils";
import { getTerminal } from "../lib/utils/getTerminal";
import { ScriptTaskProvider } from "./provider/script";
import { registerCommand } from "../lib/command/command";
import { TaskDetailsPage } from "../webview/page/taskDetails";
import { getPackageManager, sleep } from "../lib/utils/utils";
import { findDocumentPosition } from "../lib/utils/findDocumentPosition";
import { ILog, ITeTaskManager, ITeTask, TeTaskListType } from "../interface";
import {
    CustomExecution, Disposable, InputBoxOptions, Selection, ShellExecution, Task, TaskDefinition,
    TaskExecution, TaskRevealKind, tasks, TextDocument, Uri, window, workspace, WorkspaceFolder
} from "vscode";


export class TaskManager implements ITeTaskManager, Disposable
{
    private readonly log: ILog;
    private readonly _disposables: Disposable[] = [];


    constructor(private readonly wrapper: TeWrapper)
    {
        this.log = wrapper.log;
        this._disposables.push(
            registerCommand(wrapper.keys.Commands.NpmRunInstall, (item: TaskFile) => this.runNpmCommand(item, "install"), this),
            registerCommand(wrapper.keys.Commands.NpmRunUpdate, (item: TaskFile) => this.runNpmCommand(item, "update"), this),
            registerCommand(wrapper.keys.Commands.NpmRunAudit, (item: TaskFile) => this.runNpmCommand(item, "audit"), this),
            registerCommand(wrapper.keys.Commands.NpmRunAuditFix, (item: TaskFile) => this.runNpmCommand(item, "audit fix"), this),
            registerCommand(wrapper.keys.Commands.NpmRunUpdatePackage, (item: TaskFile) => this.runNpmCommand(item, "update <packagename>"), this),
            registerCommand(wrapper.keys.Commands.Open, (item: TaskItem | ITeTask, itemClick?: boolean) => this.open(this.wrapper.treeManager.getTaskItem(item), itemClick), this),
            registerCommand(wrapper.keys.Commands.Pause, (item: TaskItem | ITeTask) => this.pause(this.wrapper.treeManager.getTaskItem(item)), this),
            registerCommand(wrapper.keys.Commands.Restart, (item: TaskItem) => this.restart(item), this),
            registerCommand(wrapper.keys.Commands.Run,  (item: TaskItem | ITeTask | Uri) => this.run(this.wrapper.treeManager.getTaskItem(item)), this),
            registerCommand(wrapper.keys.Commands.RunLastTask,  () => this.runLastTask(), this),
            registerCommand(wrapper.keys.Commands.RunWithArgs, (item: TaskItem | Uri, ...args: any[]) => this.run(this.wrapper.treeManager.getTaskItem(item), false, true, ...args), this),
            registerCommand(wrapper.keys.Commands.RunWithNoTerminal, (item: TaskItem) => this.run(item, true, false), this),
			registerCommand(wrapper.keys.Commands.SetPinned, (item: TaskItem | ITeTask, listType?: TeTaskListType) => this.setPinned(item, listType), this),
            registerCommand(wrapper.keys.Commands.ShowTaskDetailsPage, (item: TaskItem | ITeTask) => this.showTaskDetailsPage(item), this),
            registerCommand(wrapper.keys.Commands.Stop, (item: TaskItem | ITeTask) => this.stop(this.wrapper.treeManager.getTaskItem(item)), this)
        );
    }

    dispose = () => this._disposables.forEach(d => d.dispose());


    private open = async(selection: TaskItem, itemClick = false) =>
    {
        const clickAction = this.wrapper.config.get<string>(this.wrapper.keys.Config.TaskButtonsClickAction, "Open");

        //
        // As of v1.30.0, added option to change the entry item click to execute.  In order to avoid having
        // to re-register the handler when the setting changes, we just re-route the request here
        //
        if (clickAction === "Execute" && itemClick === true) {
            return this.run(selection);
        }

        const uri = !isScriptType(selection.taskSource) ?
                    selection.taskFile.resourceUri : Uri.file(selection.task.definition.uri.fsPath);

        this.log.methodStart("open document at position", 1, "", true, [
            [ "command", selection.command.command ], [ "source", selection.taskSource ],
            [ "uri path", uri.path ], [ "fs path", uri.fsPath ]
        ]);

        /* istanbul ignore else */
        if (await pathExists(uri.fsPath))
        {
            const document: TextDocument = await workspace.openTextDocument(uri);
            const offset = findDocumentPosition(this.wrapper, document, selection);
            const position = document.positionAt(offset);
            await window.showTextDocument(document, { selection: new Selection(position, position) });
        }
    };


    private pause = (taskItem: TaskItem) =>
    {
        if (taskItem.paused || this.wrapper.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
            return;
        }

        this.log.methodStart("pause", 1, "", true);

        /* istanbul ignore else */
        if (taskItem.task.execution)
        {
            const terminal = getTerminal(taskItem, "   ");
            /* istanbul ignore else */
            if (terminal)
            {
                taskItem.paused = true;
                this.log.value("   send to terminal", "\\u0003", 1);
                terminal.sendText("\u0003");
            }
            else {
                window.showInformationMessage("Terminal not found");
            }
        }
        else {
            window.showInformationMessage("Executing task not found");
        }

        this.log.methodDone("pause", 1);
    };


    private restart = async(taskItem: TaskItem) =>
    {
        let exec: TaskExecution | undefined;
        this.log.methodStart("restart task", 1, "", true);
        if (this.wrapper.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
        }
        else {
            await this.stop(taskItem);
            exec = await this.run(taskItem);
        }
        this.log.methodDone("restart task", 1);
        return exec;
    };


    private resumeTask = (taskItem: TaskItem) =>
    {
        let exec: TaskExecution | undefined;
        this.log.methodStart("resume task", 1, "", true);
        const term = getTerminal(taskItem, "   ");
        if (term)
        {   //
            // TODO - see ticket.  I guess its not CTRL+C in some parts.
            // so make the control chars a setting.  Also in stop().
            //
            this.log.value("   send to terminal", "N", 1);
            term.sendText("N", true);
            exec = taskItem.execution;
        }
        else {
            window.showInformationMessage("Terminal not found");
        }
        taskItem.paused = false;
        this.log.methodDone("resume task", 1);
        return exec;
    };


    /**
     * Run/execute a command.
     * The refresh() function will eventually be called by the VSCode task engine when
     * the task is launched
     *
     * @param taskItem TaskItem instance
     * @param noTerminal Whether or not to show the terminal
     * Note that the terminal will be shown if there is an error
     * @param withArgs Whether or not to prompt for arguments
     * Note that only script type tasks use arguments (and Gradle, ref ticket #88)
     */
    private run = async(taskItem: TaskItem, noTerminal = false, withArgs = false, ...args: any[]) =>
    {
        let exec: TaskExecution | undefined;

        if (this.wrapper.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
            return exec;
        }

        this.log.methodStart("run task", 1, "", true, [[ "task name", taskItem.label ]]);
        taskItem.taskDetached = undefined;

        if (withArgs === true)
        {
            exec = await this.runWithArgs(taskItem, noTerminal, "   ", ...args);
        }
        else if (taskItem.paused)
        {
            exec = this.resumeTask(taskItem);
        }
        else //
        {   // Create a new instance of 'task' if this is to be ran with no terminal (see notes below)
            //
            let newTask = taskItem.task;
            if (noTerminal && newTask)
            {   //
                // For some damn reason, setting task.presentationOptions.reveal = TaskRevealKind.Silent or
                // task.presentationOptions.reveal = TaskRevealKind.Never does not work if we do it on the task
                // that was instantiated when the providers were asked for tasks.  If we create a new instance
                // here, same exact task, then it works.  Same kind of thing with running with args, but in that
                // case I can understand it because a new execution class has to be instantiated with the command
                // line arguments.  In this case, its simply a property task.presentationOption on an instantiated
                // task.  No idea.  But this works fine for now.
                //
                const def = newTask.definition,
                    folder = taskItem.getFolder(),
                    p = this.wrapper.providers[def.type];
                /* istanbul ignore else */
                if (folder && p)
                {
                    newTask = p.createTask(def.target, undefined, folder, def.uri, undefined, "   ") as Task;
                    //
                    // Since this task doesnt belong to a treeItem, then set the treeItem id that represents
                    // an instance of this task.
                    //
                    /* istanbul ignore else */
                    if (newTask) {
                        newTask.definition.taskItemId = def.taskItemId;
                        taskItem.taskDetached = newTask;
                    }
                    else {
                        newTask = taskItem.task;
                    }
                }
            }
            exec = await this.runTask(newTask, taskItem, noTerminal);
        }

        this.log.methodDone("run task", 1);
        return exec;
    };


    private runNpmCommand = async(taskFile: TaskFile, command: string) =>
    {
        const pkgMgr = getPackageManager(),
            uri = taskFile.resourceUri;

        const options = {
            cwd: dirname(uri.fsPath)
        };

        const kind: TaskDefinition = {
            type: "npm",
            script: "install",
            path: dirname(uri.fsPath)
        };

        if (command.indexOf("<packagename>") === -1)
        {   /* istanbul ignore else */
            if (taskFile.folder.workspaceFolder)
            {
                const execution = new ShellExecution(pkgMgr + " " + command, options);
                const task = new Task(kind, taskFile.folder.workspaceFolder, command, "npm", execution, undefined);
                return tasks.executeTask(task);
            }
        }
        else
        {
            const opts: InputBoxOptions = { prompt: "Enter package name to " + command };
            await window.showInputBox(opts).then(async (str) =>
            {
                /* istanbul ignore else */
                if (str !== undefined && taskFile.folder.workspaceFolder)
                {
                    const execution = new ShellExecution(pkgMgr + " " + command.replace("<packagename>", "").trim() + " " + str.trim(), options);
                    const task = new Task(kind, taskFile.folder.workspaceFolder, command.replace("<packagename>", "").trim() + str.trim(), "npm", execution, undefined);
                    return tasks.executeTask(task);
                }
            });
        }
    };


    private runLastTask = async() =>
    {
        if (this.wrapper.treeManager.isBusy) {
            window.showInformationMessage("Busy, please wait...");
            return;
        }

        const taskMap = this.wrapper.treeManager.getTaskMap(),
              lastTasks = this.wrapper.treeManager.lastTasksFolder,
              lastTaskId = lastTasks.getLastRanId(),
              taskItem = lastTaskId ? taskMap[lastTaskId] as TaskItem : null;

        if (!taskItem) {
            window.showInformationMessage("Task not found! Check log for details");
            return;
        }

        this.log.methodStart("run last task", 1, "", true, [[ "last task id", lastTaskId ]]);
        const exec = await this.run(taskItem);
        this.log.methodDone("run last task", 1);
        return exec;
    };


    private runTask = async (task: Task, taskItem: TaskItem, noTerminal?: boolean, logPad = "   ") =>
    {
        this.log.methodStart("internal run task", 1, logPad, false, [[ "no terminal", noTerminal ]]);
        task.presentationOptions.reveal = noTerminal !== true ? TaskRevealKind.Always : TaskRevealKind.Silent;
        const exec = await tasks.executeTask(task);
        await this.wrapper.treeManager.lastTasksFolder.saveTask(taskItem, logPad);
        this.log.methodDone("internal run task", 1, logPad, [[ "success", !!exec ]]);
        return exec;
    };


    /**
     * Run/execute a command, with arguments (prompt for args)
     *
     * @param taskItem TaskItem instance
     * @param noTerminal Whether or not to show the terminal
     * Note that the terminal will be shown if there is an error
     */
    private runWithArgs = async(taskItem: TaskItem, noTerminal: boolean, logPad: string, ...args: any[]) =>
    {
        let exec: TaskExecution | undefined;
        this.log.methodStart("run task with arguments", 1, logPad, false, [[ "no terminal", noTerminal ]]);
        /* istanbul ignore else */
        if (taskItem.task && !(taskItem.task.execution instanceof CustomExecution))
        {

            const _run = async (..._args: any[]) =>
            {
                let newTask = taskItem.task;
                const def = taskItem.task.definition,
                      folder = taskItem.getFolder();
                // if (folder)
                // {
                    newTask = (new ScriptTaskProvider(this.wrapper)).createTask(
                        def.script, undefined, folder as WorkspaceFolder, def.uri, _args, logPad + "   "
                    ) as Task;
                    newTask.definition.taskItemId = def.taskItemId;
                // }
                return this.runTask(newTask, taskItem, noTerminal, logPad + "   ");
            };

            if (args.length > 0 && !this.wrapper.typeUtils.isString(args[0])) {
                args.splice(0);
            }
            taskItem.taskDetached = undefined;
            if (args.length === 0)
            {
                const opts: InputBoxOptions = { prompt: "Enter command line arguments separated by spaces"};
                const res = await window.showInputBox(opts);
                if (res !== undefined) {
                    exec = await _run(...res.trim().split(" "));
                }
            }
            else {
                exec = await _run(...args);
            }
        }
        else {
            window.showInformationMessage("Custom execution tasks cannot have the cmd line altered");
        }
        this.log.methodDone("run task with arguments", 1, logPad);
        return exec;
    };


	private setPinned = async (taskItem: TaskItem | ITeTask, listType: TeTaskListType = "all"): Promise<void> =>
	{
        const iTask = taskItem instanceof TaskItem ?
                      this.wrapper.taskUtils.toITask(this.wrapper, [ taskItem.task ], listType)[0] : taskItem,
              storageKey: PinnedStorageKey = `taskexplorer.pinned.${iTask.listType}`;
		this.log.methodStart("set pinned task", 2, "", false, [[ "id", iTask.treeId ], [ "pinned", iTask.pinned ]]);
		const pinnedTaskList = this.wrapper.storage.get<ITeTask[]>(storageKey, []);
        const pinnedIdx =  pinnedTaskList.findIndex((t) => t.treeId === iTask.treeId);
        if (pinnedIdx === -1) {
		    pinnedTaskList.push({  ...iTask });
        }
        else {
            pinnedTaskList.splice(pinnedIdx, 1);
        }
		await this.wrapper.storage.update(storageKey, pinnedTaskList);
		this.log.methodDone("set pinned task", 2);
        // await this._taskUsageTracker.setPinned(task, logPad);
	};


    private showTaskDetailsPage = (taskItem: TaskItem | ITeTask): Promise<TaskDetailsPage> =>
    {
        const iTask = taskItem instanceof TaskItem ?
                      this.wrapper.taskUtils.toITask(this.wrapper, [ taskItem.task ], "all")[0] : taskItem,
              taskDetailsPage = new TaskDetailsPage(this.wrapper, iTask);
        return taskDetailsPage.show();
    };


    private stop = async(taskItem: TaskItem) =>
    {
        this.log.methodStart("stop", 1, "", true);

        if (this.wrapper.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
            return;
        }

        const exec = taskItem.isExecuting();
        if (exec)
        {
            if (this.wrapper.config.get<boolean>(this.wrapper.keys.Config.KeepTerminalOnTaskDone) === true && !taskItem.taskDetached)
            {
                const terminal = getTerminal(taskItem, "   ");
                /* istanbul ignore else */
                if (terminal)
                {
                    const ctrlChar = this.wrapper.config.get<string>(this.wrapper.keys.Config.TaskButtonsControlCharacter, "Y");
                    this.log.write("   keep terminal open", 1);
                    if (taskItem.paused)
                    {
                        taskItem.paused = false;
                        this.log.value("   send to terminal", ctrlChar, 1);
                        terminal.sendText(ctrlChar);
                    }
                    else
                    {
                        this.log.value("   send sequence to terminal", "\\u0003", 1);
                        terminal.sendText("\u0003");
                        await sleep(50);
                        this.log.value("   send to terminal", ctrlChar, 1);
                        // terminal = getTerminal(taskItem, "   ");
                        try { /* istanbul ignore else */if (getTerminal(taskItem, "   ")) terminal.sendText(ctrlChar, true); } catch {}
                    }
                }
                else {
                    window.showInformationMessage("Terminal not found");
                }
            }
            else {
                this.log.write("   kill task execution", 1);
                try { exec.terminate(); } catch {}
            }
        }
        else {
            window.showInformationMessage("Executing task not found");
        }

        taskItem.paused = false;
        this.log.methodDone("stop", 1);
    };

}

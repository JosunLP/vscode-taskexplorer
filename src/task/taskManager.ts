
import { dirname } from "path";
import { TaskFile } from "../tree/file";
import { TaskItem } from "../tree/item";
import { TeWrapper } from "../lib/wrapper";
import { PinnedStorageKey } from "../lib/constants";
import { getTerminal } from "../lib/utils/getTerminal";
import { ScriptTaskProvider } from "./provider/script";
import { registerCommand } from "../lib/command/command";
import { TaskDetailsPage } from "../webview/page/taskDetails";
import { findDocumentPosition } from "../lib/utils/findDocumentPosition";
import { ILog, ITeTaskManager, ITeTask, TeTaskListType } from "../interface";
import {
    CustomExecution, Disposable, InputBoxOptions, Selection, ShellExecution, Task, TaskDefinition,
    TaskExecution, TaskRevealKind, tasks, TextDocument, Uri, window, workspace, WorkspaceFolder
} from "vscode";


export class TaskManager implements ITeTaskManager, Disposable
{
    private readonly _log: ILog;
    private readonly _disposables: Disposable[] = [];


    constructor(private readonly wrapper: TeWrapper)
    {
        this._log = wrapper.log;
        this._disposables.push(
            registerCommand(wrapper.keys.Commands.NpmRunInstall, (item: TaskFile) => this.runNpmCommand(item, "install"), this),
            registerCommand(wrapper.keys.Commands.NpmRunUpdate, (item: TaskFile) => this.runNpmCommand(item, "update"), this),
            registerCommand(wrapper.keys.Commands.NpmRunAudit, (item: TaskFile) => this.runNpmCommand(item, "audit"), this),
            registerCommand(wrapper.keys.Commands.NpmRunAuditFix, (item: TaskFile) => this.runNpmCommand(item, "audit fix"), this),
            registerCommand(wrapper.keys.Commands.NpmRunUpdatePackage, (item: TaskFile) => this.runNpmCommand(item, "update <packagename>"), this),
            registerCommand(wrapper.keys.Commands.Open, this.open, this),
            registerCommand(wrapper.keys.Commands.Pause, this.pause, this),
            registerCommand(wrapper.keys.Commands.Restart, this.restart, this),
            registerCommand(wrapper.keys.Commands.Run, this.run, this),
            registerCommand(wrapper.keys.Commands.RunLastTask, this.runLastTask, this),
            registerCommand(wrapper.keys.Commands.RunWithArgs, (item: TaskItem | Uri, ...args: any[]) => this.run(item, false, true, ...args), this),
            registerCommand(wrapper.keys.Commands.RunWithNoTerminal, (item: TaskItem) => this.run(item, true, false), this),
			registerCommand(wrapper.keys.Commands.SetPinned, this.setPinned, this),
            registerCommand(wrapper.keys.Commands.ShowTaskDetailsPage, this.showTaskDetailsPage, this),
            registerCommand(wrapper.keys.Commands.Stop, this.stop, this)
        );
    }

    dispose = () => this._disposables.forEach(d => d.dispose());


    private open = async(item: TaskItem | ITeTask | Uri, itemClick = false) =>
    {
        const w = this.wrapper,
              taskItem = this.wrapper.treeManager.getTaskItem(item),
              clickAction = w.config.get<string>(w.keys.Config.TaskButtonsClickAction, "Open");
        //
        // As of v1.30.0, added option to change the entry item click to execute.  In order to avoid having
        // to re-register the handler when the setting changes, we just re-route the request here
        //
        if (clickAction === "Execute" && itemClick === true) {
            return this.run(taskItem);
        }

        const uri = !w.taskUtils.isScriptType(taskItem.taskSource) ?
                    taskItem.taskFile.resourceUri : Uri.file(taskItem.task.definition.uri.fsPath);

        this._log.methodStart("open document at position", 1, "", true, [
            [ "command", taskItem.command.command ], [ "source", taskItem.taskSource ],
            [ "uri path", uri.path ], [ "fs path", uri.fsPath ]
        ]);

        await w.utils.execIf(w.fs.pathExistsSync(uri.fsPath), async () =>
        {
            const document: TextDocument = await workspace.openTextDocument(uri),
                  offset = findDocumentPosition(w, document, taskItem, "   "),
                  position = document.positionAt(offset);
            await window.showTextDocument(document, { selection: new Selection(position, position) });
        }, this);

        this._log.methodDone("open document at position", 1);
    };


    private pause = (item: TaskItem | ITeTask | Uri) =>
    {
        const taskItem = this.wrapper.treeManager.getTaskItem(item);
        if (taskItem.paused || this.wrapper.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
            return;
        }

        this._log.methodStart("pause", 1, "", true);

        this.wrapper.utils.execIf(taskItem.task.execution, () =>
        {
            const terminal = getTerminal(taskItem, "   ");
            this.wrapper.utils.execIf(terminal, (t) =>
            {
                taskItem.paused = true;
                this._log.value("   send to terminal", "\\u0003", 1);
                t.sendText("\u0003");
            },
            this, [ window.showInformationMessage, "Terminal not found" ]);
        },
        this, [ window.showInformationMessage, "Executing task not found" ]);

        this._log.methodDone("pause", 1);
    };


    private restart = async(taskItem: TaskItem) =>
    {
        let exec: TaskExecution | undefined;
        this._log.methodStart("restart task", 1, "", true);
        if (this.wrapper.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
        }
        else {
            await this.stop(taskItem);
            exec = await this.run(taskItem);
        }
        this._log.methodDone("restart task", 1);
        return exec;
    };


    private resumeTask = (taskItem: TaskItem) =>
    {
        let exec: TaskExecution | undefined;
        this._log.methodStart("resume task", 1, "", true);
        const term = getTerminal(taskItem, "   ");
        if (term)
        {   //
            // TODO - see ticket. its not CTRL+C in some parts so make the ctrl char a setting. Also stop().
            //
            this._log.value("   send to terminal", "N", 1);
            term.sendText("N", true);
            exec = taskItem.execution;
        }
        else {
            window.showInformationMessage("Terminal not found");
        }
        taskItem.paused = false;
        this._log.methodDone("resume task", 1);
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
    private run = async(item: TaskItem | ITeTask | Uri, noTerminal = false, withArgs = false, ...args: any[]) =>
    {
        let exec: TaskExecution | undefined;
        const taskItem = this.wrapper.treeManager.getTaskItem(item);

        if (this.wrapper.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
            return exec;
        }

        this._log.methodStart("run task", 1, "", true, [[ "task name", taskItem.label ]]);
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
                this.wrapper.utils.execIf(!!folder && !!p, (_v, f) =>
                {
                    newTask = p.createTask(def.target, undefined, f, def.uri, undefined, "   ") as Task;
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
                }, this, null, folder as WorkspaceFolder);
            }
            exec = await this.runTask(newTask, taskItem, noTerminal);
        }

        this._log.methodDone("run task", 1);
        return exec;
    };


    private runNpmCommand = async(taskFile: TaskFile, command: string) =>
    {
        const pkgMgr = this.wrapper.utils.getPackageManager(),
              uri = taskFile.resourceUri,
              options = { cwd: dirname(uri.fsPath) },
              kind: TaskDefinition = { type: "npm", script: command, path: dirname(uri.fsPath) };
        if (command.indexOf("<packagename>") === -1)
        {
            this.wrapper.utils.execIf(taskFile.folder.workspaceFolder, (wsf) =>
            {
                const execution = new ShellExecution(pkgMgr + " " + command, options);
                const task = new Task(kind, wsf, command, "npm", execution, undefined);
                return tasks.executeTask(task);
            }, this);
        }
        else
        {
            const opts: InputBoxOptions = { prompt: "Enter package name to " + command };
            await window.showInputBox(opts).then(async (str) =>
            {
                this.wrapper.utils.execIf(!!(str !== undefined && taskFile.folder.workspaceFolder), (_v, wsf, s) =>
                {
                    kind.script = command.replace("<packagename>", s as string).trim();
                    const execution = new ShellExecution(pkgMgr + " " + kind.script, options);
                    const task = new Task(kind, wsf as WorkspaceFolder, kind.script, "npm", execution, undefined);
                    return tasks.executeTask(task);
                }, this, null, taskFile.folder.workspaceFolder, str);
            });
        }
    };


    private runLastTask = async() =>
    {
        if (this.wrapper.treeManager.isBusy) {
            window.showInformationMessage("Busy, please wait...");
            return;
        }
        const taskMap = this.wrapper.treeManager.taskMap,
              lastTasks = this.wrapper.treeManager.lastTasksFolder,
              lastTaskId = lastTasks.getLastRanId(),
              taskItem = lastTaskId ? taskMap[lastTaskId] as TaskItem : null;
        if (!taskItem) {
            window.showInformationMessage("Task not found! Check log for details");
            return;
        }
        this._log.methodStart("run last task", 1, "", true, [[ "last task id", lastTaskId ]]);
        const exec = await this.run(taskItem);
        this._log.methodDone("run last task", 1);
        return exec;
    };


    private runTask = async (task: Task, taskItem: TaskItem, noTerminal?: boolean, logPad = "   ") =>
    {
        this._log.methodStart("internal run task", 1, logPad, false, [[ "no terminal", noTerminal ]]);
        task.presentationOptions.reveal = noTerminal !== true ? TaskRevealKind.Always : TaskRevealKind.Silent;
        const exec = await tasks.executeTask(task);
        await this.wrapper.treeManager.lastTasksFolder.saveTask(taskItem, logPad + "   ");
        this._log.methodDone("internal run task", 1, logPad, [[ "success", !!exec ]]);
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
        this._log.methodStart("run task with arguments", 1, logPad, false, [[ "no terminal", noTerminal ]]);
        await this.wrapper.utils.execIf(taskItem.task && !(taskItem.task.execution instanceof CustomExecution), async () =>
        {
            const _run = async (..._args: any[]) =>
            {
                let newTask = taskItem.task;
                const def = taskItem.task.definition;
                this.wrapper.utils.execIf(taskItem.getFolder(), (f) =>
                {
                    newTask = (new ScriptTaskProvider(this.wrapper)).createTask(
                        def.script, undefined, f, def.uri, _args, logPad + "   "
                    ) as Task;
                    newTask.definition.taskItemId = def.taskItemId;
                }, this);
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
        }, this, [ window.showInformationMessage, "Custom execution tasks cannot have the cmd line altered" ]);
        this._log.methodDone("run task with arguments", 1, logPad);
        return exec;
    };


	private setPinned = async (taskItem: TaskItem | ITeTask, listType: TeTaskListType = "all"): Promise<void> =>
	{
        const w = this.wrapper,
              iTask = taskItem instanceof TaskItem ?
                      w.taskUtils.toITask(w, [ taskItem.task ], listType)[0] : taskItem,
              storageKey: PinnedStorageKey = `taskexplorer.pinned.${iTask.listType}`;
		this._log.methodStart("set pinned task", 2, "", false, [[ "id", iTask.treeId ], [ "pinned", iTask.pinned ]]);
		const pinnedTaskList = w.storage.get<ITeTask[]>(storageKey, []),
              pinnedIdx =  pinnedTaskList.findIndex((t) => t.treeId === iTask.treeId);
        if (pinnedIdx === -1) {
		    pinnedTaskList.push({  ...iTask });
        }
        else {
            pinnedTaskList.splice(pinnedIdx, 1);
        }
		await w.storage.update(storageKey, pinnedTaskList);
		this._log.methodDone("set pinned task", 2);
        // await this._taskUsageTracker.setPinned(task, logPad);
	};


    private showTaskDetailsPage = (taskItem: TaskItem | ITeTask): Promise<TaskDetailsPage> =>
    {
        const iTask = taskItem instanceof TaskItem ?
                      this.wrapper.taskUtils.toITask(this.wrapper, [ taskItem.task ], "all")[0] : taskItem,
              taskDetailsPage = new TaskDetailsPage(this.wrapper, iTask);
        return taskDetailsPage.show();
    };


    private stop = async(item: TaskItem | ITeTask | Uri) =>
    {
        const w = this.wrapper,
              taskItem = this.wrapper.treeManager.getTaskItem(item);
        this._log.methodStart("stop", 1, "", true);

        if (w.treeManager.isBusy)
        {
            window.showInformationMessage("Busy, please wait...");
            return;
        }

        const exec = taskItem.isExecuting();
        if (exec)
        {
            if (w.config.get<boolean>(w.keys.Config.KeepTerminalOnTaskDone) === true && !taskItem.taskDetached)
            {
                const terminal = getTerminal(taskItem, "   ");
                /* istanbul ignore else */
                if (terminal)
                {
                    const ctrlChar = w.config.get<string>(w.keys.Config.TaskButtonsControlCharacter, "Y");
                    this._log.write("   keep terminal open", 1);
                    if (taskItem.paused)
                    {
                        taskItem.paused = false;
                        this._log.value("   send to terminal", ctrlChar, 1);
                        terminal.sendText(ctrlChar);
                    }
                    else
                    {
                        this._log.value("   send sequence to terminal", "\\u0003", 1);
                        terminal.sendText("\u0003");
                        await w.utils.sleep(50);
                        this._log.value("   send to terminal", ctrlChar, 1);
                        // terminal = getTerminal(taskItem, "   ");
                        try {
                            w.utils.execIf(getTerminal(taskItem, "   "), (t) => t.sendText(ctrlChar, true), this);
                        } catch {}
                    }
                }
                else {
                    window.showInformationMessage("Terminal not found");
                }
            }
            else {
                this._log.write("   kill task execution", 1);
                try { exec.terminate(); } catch {}
            }
        }
        else {
            window.showInformationMessage("Executing task not found");
        }

        taskItem.paused = false;
        this._log.methodDone("stop", 1);
    };

}

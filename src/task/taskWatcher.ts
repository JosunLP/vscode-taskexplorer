/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TeWrapper } from "../lib/wrapper";
import { TaskItem } from "../tree/item";
import { ITeTaskStatusChangeEvent, ITeRunningTaskChangeEvent } from "../interface";
import {
    Disposable, Event, WorkspaceFolder, tasks, TaskStartEvent, StatusBarItem, StatusBarAlignment,
    Task, window, TaskEndEvent, EventEmitter, TaskProcessEndEvent, TaskProcessStartEvent
} from "vscode";


export class TaskWatcher implements Disposable
{
    private readonly _statusBarSpace: StatusBarItem;
    private readonly _disposables: Disposable[];
    private readonly _onTaskStatusChange: EventEmitter<ITeTaskStatusChangeEvent>;
    private readonly _onDidRunningTasksChange: EventEmitter<ITeRunningTaskChangeEvent>;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._statusBarSpace = window.createStatusBarItem(StatusBarAlignment.Left, -10000);
        this._statusBarSpace.tooltip = `${wrapper.extensionName} Running Task`;
        this._onTaskStatusChange = new EventEmitter<ITeTaskStatusChangeEvent>();
        this._onDidRunningTasksChange = new EventEmitter<ITeRunningTaskChangeEvent>();
        this._disposables = [
            this._statusBarSpace,
            this._onTaskStatusChange,
            this._onDidRunningTasksChange,
            tasks.onDidStartTask((e) => this.taskStartEvent(e), this),
            tasks.onDidEndTask((e) => this.taskFinishedEvent(e), this),
            tasks.onDidStartTaskProcess((e) => this.taskProcessStartEvent(e), this),
            tasks.onDidEndTaskProcess((e) => this.taskProcessFinishedEvent(e), this)
        ];
    }

    dispose = () => this._disposables.forEach(d => d.dispose());


    get onDidRunningTasksChange(): Event<ITeRunningTaskChangeEvent> {
        return this._onDidRunningTasksChange.event;
    }

    get onDidTaskStatusChange(): Event<ITeTaskStatusChangeEvent> {
        return this._onTaskStatusChange.event;
    }


    private fireTaskChangeEvents(taskItem: TaskItem, isRunning: boolean, logPad: string): void
    {
        this.wrapper.log.methodStart("fire task change events", 1, logPad, false, [
            [ "task name", taskItem.task.name ], [ "task type", taskItem.task.source ],
            [ "resource path", taskItem.taskFile.resourceUri.fsPath ]
        ]);
        //
        // Fire change event for parent folder.  Firing the change event for the task item itself
        // does not cause the getTreeItem() callback to be called from VSCode Tree API.  Firing it
        // on the parent folder (type TreeFile) works good though.  Pre v2, we refreshed the entire
        // tree, so this is still good.  TODO possibly this gets fixed in the future to be able to
        // invalidate just the TaskItem, so check back on this sometime.
        //
        this.wrapper.log.write("   request fire tree refresh event", 1, logPad);
        this.wrapper.treeManager.fireTreeRefreshEvent(taskItem.taskFile, taskItem, logPad + "   ");
        //
        this.wrapper.log.write("   fire 'task status changed' and 'running tasks changed' events", 1, logPad);
        const iTask = this.wrapper.taskUtils.toITask(this.wrapper, [ taskItem.task ], "running")[0];
        // const iTasks = this.wrapper.taskUtils.toITask(this.wrapper.usage, this.wrapper.treeManager.runningTasks, "running");
        this._onTaskStatusChange.fire({ task: iTask, treeId: taskItem.id, isRunning });
        // this._onDidRunningTasksChange.fire({ tasks: iTasks, task: iTask, treeId: taskItem.id, isRunning });
        this._onDidRunningTasksChange.fire({ tasks: [], task: iTask, treeId: taskItem.id, isRunning });
        //
        this.wrapper.log.methodDone("fire task change events", 1, logPad);
    }


    private showStatusMessage(task: Task, logPad: string): void
    {
        this.wrapper.log.methodStart("task start/stop show/hide message", 2, logPad);
        if (task && this.wrapper.config.get<boolean>("showRunningTask") === true)
        {
            const exec = tasks.taskExecutions.find(e => e.task.name === task.name && e.task.source === task.source &&
                         e.task.scope === task.scope && e.task.definition.path === task.definition.path);
            if (exec)
            {
                this.wrapper.log.methodStart("   found running task, show status message", 2, logPad);
                let statusMsg = task.name;
                /* istanbul ignore else */
                if ((task.scope as WorkspaceFolder).name) {
                    statusMsg += " (" + (task.scope as WorkspaceFolder).name + ")";
                }
                this._statusBarSpace.text = "$(loading~spin) " + statusMsg;
                this._statusBarSpace.show();
            }
            else {
                this.wrapper.log.methodStart("   found idle/stopped task, hide status message", 2, logPad);
                this._statusBarSpace.hide();
            }
        }
        this.wrapper.log.methodDone("task start/stop show/hide message", 2, logPad);
    }


    private taskProcessStartEvent = (e: TaskProcessStartEvent) =>
        this.wrapper.log.methodOnce("task watcher", "process start", 2, "", [[ "pid", e.processId ], [ "task name", e.execution.task.name ]]);


    private taskProcessFinishedEvent = (e: TaskProcessEndEvent) =>
        this.wrapper.log.methodOnce("task watcher", "process start", 2, "", [[ "exit code", e.exitCode ], [ "task name", e.execution.task.name ]]);


    private async taskStartEvent(e: TaskStartEvent): Promise<void>
    {
        const taskMap = this.wrapper.treeManager.getTaskMap(),
              taskTree = this.wrapper.treeManager.getTaskTree(),
              task = e.execution.task,
              treeId = task.definition.taskItemId,
              isMapEmpty = this.wrapper.typeUtils.isObjectEmpty(taskMap);

        this.wrapper.log.methodStart("task started event", 1, "", false, [[ "task name", task.name ], [ "task id", treeId ]]);

        //
        // If taskMap is empty, then this view has not yet been made visible, an there's nothing
        // to update.  The `taskTree` property should also be null.  We could probably do this
        // before the timer check above, but hey, just in case taskMap goes empty between events
        // for some un4seen reason.
        //
        if (isMapEmpty || !taskMap[treeId])
        {
            /* istanbul ignore next */
            if (taskTree && !taskMap[treeId] && taskTree.length > 0 && taskTree[0].contextValue !== "noscripts")
            {
                if (task.source === "npm" && task.definition.type === "npm" &&
                (task.name === "build" || task.name === "install" || task.name === "watch" || task.name.startsWith("update")  || task.name.startsWith("audit")))
                {
                    return;
                }
                this.wrapper.log.error(`The task map is ${isMapEmpty ? "empty" : "missing the running task"} but ` +
                                       `the task tree is non-null and holds ${taskTree.length} folders (task start event)`,
                                       [[ "# of tasks in task map", Object.keys(taskMap).length ], [ "task name", task.name ],
                                       [ "task source", task.source ], [ "task type", task.definition.type ]]);
            }
        }
        else
        {
            const taskItem = taskMap[treeId] as TaskItem;
            this.showStatusMessage(task, "   ");
            this.fireTaskChangeEvents(taskItem, true, "   ");
        }

        this.wrapper.log.methodDone("task started event", 1);
    }


    private async taskFinishedEvent(e: TaskEndEvent): Promise<void>
    {
        const taskMap = this.wrapper.treeManager.getTaskMap(),
              taskTree = this.wrapper.treeManager.getTaskTree(),
              task = e.execution.task,
              treeId = task.definition.taskItemId,
              isMapEmpty = this.wrapper.typeUtils.isObjectEmpty(taskMap);

        this.wrapper.log.methodStart("task finished event", 1, "", false, [[ "task name", task.name ], [ "task id", treeId ]]);

        this.showStatusMessage(task, "  "); // hides

        //
        // If taskMap is empty, then this view has not yet been made visible or an event fired
        // that caused the tree to refresh (e.g. when tests end and the package.json file is
        // restored, both the file hanged and task finished events fire at the same time from
        // VSCode). So there's nothing to update in the tree right now in these cases.  The
        // `taskTree` property should also be null.  This will usually fall through when both
        // the Explorer and SideBar views are enabled, but the sidebar hasn't received a visible
        // event yet, i.e. it hasn't been opened yet by the user.
        //
        if (isMapEmpty || !taskMap[treeId])
        {
            /* istanbul ignore next */
            if (taskTree && !taskMap[treeId] && taskTree.length > 0 && taskTree[0].contextValue !== "noscripts")
            {
                if (task.source === "npm" && task.definition.type === "npm" &&
                (task.name === "build" || task.name === "install" || task.name === "watch" || task.name.startsWith("update")  || task.name.startsWith("audit")))
                {
                    return;
                }
                this.wrapper.log.error(`The task map is ${isMapEmpty ? "empty" : "missing the running task"} but ` +
                                       `the task tree is non-null and holds ${taskTree.length} folders (task start event)`,
                                       [[ "# of tasks in task map", Object.keys(taskMap).length ], [ "task name", task.name ],
                                       [ "task source", task.source ], [ "task type", task.definition.type ]]);
            }
        }
        else {
            const taskItem = taskMap[treeId] as TaskItem;
            this.fireTaskChangeEvents(taskItem, false, "   ");
        }

        this.wrapper.log.methodDone("task finished event", 1);
    }

}

/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TaskItem } from "../tree/node/item";
import { TeWrapper } from "../lib/wrapper";
import { ITeTaskStatusChangeEvent, ITeRunningTaskChangeEvent } from "../interface";
import {
    Disposable, Event, WorkspaceFolder, tasks, TaskStartEvent, Task, TaskEndEvent, EventEmitter,
    TaskProcessEndEvent, TaskProcessStartEvent
} from "vscode";


export class TaskWatcher implements Disposable
{
    private readonly _disposables: Disposable[];
    private readonly _onTaskStatusChange: EventEmitter<ITeTaskStatusChangeEvent>;
    private readonly _onDidRunningTasksChange: EventEmitter<ITeRunningTaskChangeEvent>;


    constructor(private readonly wrapper: TeWrapper)
    {
        this._onTaskStatusChange = new EventEmitter<ITeTaskStatusChangeEvent>();
        this._onDidRunningTasksChange = new EventEmitter<ITeRunningTaskChangeEvent>();
        this._disposables = [
            this._onTaskStatusChange,
            this._onDidRunningTasksChange,
            tasks.onDidStartTask(this.taskStartEvent, this),
            tasks.onDidEndTask(this.taskFinishedEvent, this),
            tasks.onDidStartTaskProcess(this.taskProcessStartEvent, this),
            tasks.onDidEndTaskProcess(this.taskProcessFinishedEvent, this)
        ];
    }

    dispose = () => this._disposables.splice(0).forEach(d => d.dispose());


    get onDidRunningTasksChange(): Event<ITeRunningTaskChangeEvent> {
        return this._onDidRunningTasksChange.event;
    }

    get onDidTaskStatusChange(): Event<ITeTaskStatusChangeEvent> {
        return this._onTaskStatusChange.event;
    }


    private fireTaskChangeEvents(taskItem: TaskItem, isRunning: boolean): void
    {
        this.wrapper.log.write2("taskwatcher", "fire task change events", 1, "   ", [
            [ "task name", taskItem.task.name ], [ "task type", taskItem.task.source ],
            [ "resource path", taskItem.taskFile.uri.fsPath ]
        ]);
        //
        // Request tree change event-fire for parent TaskFolder | TaskFile
        //
        this.wrapper.treeManager.fireTreeRefreshEvent(taskItem.taskFile, taskItem, "      ");
        //
        // Fire TaskWatcher managed events
        //
        const iTask = this.wrapper.taskUtils.toITask(this.wrapper, [ taskItem.task ], "running")[0];
        this._onTaskStatusChange.fire({ task: iTask, treeId: taskItem.id, isRunning });
        this._onDidRunningTasksChange.fire({ tasks: [], task: iTask, treeId: taskItem.id, isRunning });
        this.wrapper.log.methodDone("fire task change events", 1, "   ");
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
                this.wrapper.statusBar.update(`${task.name} (${(task.scope as WorkspaceFolder).name})`);
            }
            else {
                this.wrapper.log.methodStart("   found idle/stopped task, hide status message", 2, logPad);
                this.wrapper.statusBar.update("");
            }
        }
        this.wrapper.log.methodDone("task start/stop show/hide message", 2, logPad);
    }


    private taskProcessStartEvent = (e: TaskProcessStartEvent) => {
        this.wrapper.log.methodEvent("task watcher", "process start", 2, [[ "pid", e.processId ], [ "task name", e.execution.task.name ]]);
    };


    private taskProcessFinishedEvent = (e: TaskProcessEndEvent) => {
        this.wrapper.log.methodEvent("task watcher", "process finished", 2, [[ "exit code", e.exitCode ], [ "task name", e.execution.task.name ]]);
    };


    private taskStartEvent(e: TaskStartEvent): void
    {
        let taskItem: TaskItem | undefined;
        const taskMap = this.wrapper.treeManager.taskMap,
              taskFolders = this.wrapper.treeManager.taskFolders,
              task = e.execution.task,
              treeId = task.definition.taskItemId,
              isMapEmpty = this.wrapper.typeUtils.isObjectEmpty(taskMap);

        this.wrapper.log.methodStart("task started event", 1, "", false, [[ "task name", task.name ], [ "task id", treeId ]]);

        /* istanbul ignore next */
        if (task.source === "Workspace" && !treeId)
        {
            taskItem = Object.values(taskMap).find(
                (t): t is TaskItem => !!t && t.taskSource === "Workspace" && t.task.definition.type === task.definition.type && task.name.includes(t.task.name)
            );
        } //
         // If taskMap is empty, then this view has not yet been made visible, an there's nothing
        // to update.  The `taskTree` property should also be null.  We could probably do this
        // before the timer check above, but hey, just in case taskMap goes empty between events
        // for some un4seen reason.
        //
        else if (!treeId || isMapEmpty || !taskMap[treeId])
        {
            /* istanbul ignore next */
            if (taskFolders && !taskMap[treeId] && taskFolders.length > 0 && this.wrapper.treeManager.getMessage() !== this.wrapper.keys.Strings.NoTasks)
            {
                if (!(task.source === "npm" && task.definition.type === "npm" &&
                     (task.name === "build" || task.name === "install" || task.name === "watch" || task.name.startsWith("update")  || task.name.startsWith("audit"))))
                {
                    this.wrapper.log.error(`The task map is ${isMapEmpty ? "empty" : "missing the running task"} but ` +
                        `the task tree is non-null and holds ${taskFolders.length} folders (task start event)`,
                    [[ "# of tasks in task map", Object.keys(taskMap).length ], [ "task name", task.name ],
                     [ "task source", task.source ], [ "task type", task.definition.type ]]);
                }
            }
        }
        else {
            taskItem = taskMap[treeId];
        }

        if (taskItem)
        {
            this.showStatusMessage(task, "   ");
            this.wrapper.treeManager.lastTasksFolder.saveTask(taskItem).then(i => this.fireTaskChangeEvents(i, true));
        }

        this.wrapper.log.methodDone("task started event", 1);
    }


    private taskFinishedEvent(e: TaskEndEvent): void
    {
        let taskItem: TaskItem | undefined;
        const taskMap = this.wrapper.treeManager.taskMap,
              taskFolders = this.wrapper.treeManager.taskFolders,
              task = e.execution.task,
              treeId = task.definition.taskItemId,
              isMapEmpty = this.wrapper.typeUtils.isObjectEmpty(taskMap);

        this.wrapper.log.methodStart("task finished event", 1, "", false, [[ "task name", task.name ], [ "task id", treeId ]]);
        this.showStatusMessage(task, "  "); // hides

        /* istanbul ignore next */
        if (task.source === "Workspace" && !treeId)
        {
            taskItem = Object.values(taskMap).find(
                (t): t is TaskItem => !!t && t.taskSource === "Workspace" && t.task.definition.type === task.definition.type && task.name.includes(t.task.name)
            );
        } //
         // If taskMap is empty, then this view has not yet been made visible or an event fired
        // that caused the tree to refresh (e.g. when tests end and the package.json file is
        // restored, both the file hanged and task finished events fire at the same time from
        // VSCode). So there's nothing to update in the tree right now in these cases.  The
        // `taskTree` property should also be null.  This will usually fall through when both
        // the Explorer and SideBar views are enabled, but the sidebar hasn't received a visible
        // event yet, i.e. it hasn't been opened yet by the user.
        //
        else if (!treeId || isMapEmpty || !taskMap[treeId])
        {    //
            /* istanbul ignore next */
            if (taskFolders && !taskMap[treeId] && taskFolders.length > 0 && taskFolders[0].contextValue !== "noscripts")
            {
                if (!(task.source === "npm" && task.definition.type === "npm" &&
                     (task.name === "build" || task.name === "install" || task.name === "watch" || task.name.startsWith("update")  || task.name.startsWith("audit"))))
                {
                    this.wrapper.log.error(`The task map is ${isMapEmpty ? "empty" : "missing the running task"} but ` +
                    `the task tree is non-null and holds ${taskFolders.length} folders (task start event)`,
                    [[ "# of tasks in task map", Object.keys(taskMap).length ], [ "task name", task.name ],
                     [ "task source", task.source ], [ "task type", task.definition.type ]]);
                }
            }
        }
        else {
            taskItem = taskMap[treeId];
        }

        if (taskItem) {
            this.fireTaskChangeEvents(taskItem, false);
        }

        this.wrapper.log.methodDone("task finished event", 1);
    }

}

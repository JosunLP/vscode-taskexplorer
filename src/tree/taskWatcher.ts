/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TaskItem } from "./item";
import { TeWrapper } from "../lib/wrapper";
import { SpecialTaskFolder } from "./specialFolder";
import { ITeTaskStatusChangeEvent, ITeRunningTaskChangeEvent } from "../interface";
import {
    Disposable, Event, WorkspaceFolder, tasks, TaskStartEvent, StatusBarItem, StatusBarAlignment,
    Task, window, TaskEndEvent, EventEmitter
} from "vscode";


export class TaskWatcher implements Disposable
{

    private statusBarSpace: StatusBarItem;
    private disposables: Disposable[];
    private specialFolders: { favorites: SpecialTaskFolder; lastTasks: SpecialTaskFolder };
    private readonly _onTaskStatusChange: EventEmitter<ITeTaskStatusChangeEvent>;
    private readonly _onDidRunningTasksChange: EventEmitter<ITeRunningTaskChangeEvent>;


    constructor(private readonly wrapper: TeWrapper, specialFolders: { favorites: SpecialTaskFolder; lastTasks: SpecialTaskFolder })
    {
        this.specialFolders = specialFolders;
        this.statusBarSpace = window.createStatusBarItem(StatusBarAlignment.Left, -10000);
        this.statusBarSpace.tooltip = "Task Explorer Running Task";
        this._onTaskStatusChange = new EventEmitter<ITeTaskStatusChangeEvent>();
        this._onDidRunningTasksChange = new EventEmitter<ITeRunningTaskChangeEvent>();
        this.disposables = [
            this.statusBarSpace,
            this._onTaskStatusChange,
            this._onDidRunningTasksChange,
            tasks.onDidStartTask(async(e) => this.taskStartEvent(e)),
            tasks.onDidEndTask(async(e) => this.taskFinishedEvent(e)),
            // tasks.onDidStartTaskProcess(async(e) => this.taskProcessStartEvent(e)),
            // tasks.onDidEndTaskProcess(async(e) => this.taskProcessFinishedEvent(e))
        ];
    }


    dispose()
    {
        this.disposables.forEach((d) => {
            d.dispose();
        });
        this.disposables = [];
    }


    get onDidRunningTasksChange(): Event<ITeRunningTaskChangeEvent> {
        return this._onDidRunningTasksChange.event;
    }

    get onDidTaskStatusChange(): Event<ITeTaskStatusChangeEvent> {
        return this._onTaskStatusChange.event;
    }


    fireTaskChangeEvents(taskItem: TaskItem, logPad: string, logLevel: number): void
    {
        const taskTree = this.wrapper.treeManager.getTaskTree();
        /* istanbul ignore if */
        if (!taskItem || !taskItem.task || !taskItem.taskFile) {
            this.wrapper.log.error(`fire task change event type invalid, received ${typeof taskItem}`);
            return;
        }
        /* istanbul ignore if */
        if (!taskItem.task || !taskItem.taskFile) {
            this.wrapper.log.error(`fire task change event invalid (${!taskItem.task}/${!taskItem.taskFile})`);
            return;
        }

        const isTaskItem = taskItem instanceof TaskItem;
        this.wrapper.log.methodStart("fire task change events", logLevel, logPad, false, [
            [ "task name", taskItem.task.name ], [ "task type", taskItem.task.source ],
            [ "resource path", taskItem.taskFile.resourceUri.fsPath ]
        ]);

        /* istanbul ignore if */
        if (!taskTree) {
            this.wrapper.log.write("   no task tree!!", logLevel, logPad);
            this.wrapper.log.methodDone("fire task change events", logLevel, logPad);
            return;
        }

        /* istanbul ignore if */
        if (!isTaskItem) {
            this.wrapper.log.write("   change event object is not a taskitem!!", logLevel, logPad);
            this.wrapper.log.methodDone("fire task change events", logLevel, logPad);
            return;
        }

        //
        // Fire change event for parent folder.  Firing the change event for the task item itself
        // does not cause the getTreeItem() callback to be called from VSCode Tree API.  Firing it
        // on the parent folder (type TreeFile) works good though.  Pre v2, we refreshed the entire
        // tree, so this is still good.  TODO possibly this gets fixed in the future to be able to
        // invalidate just the TaskItem, so check back on this sometime.
        //
        this.wrapper.treeManager.fireTreeRefreshEvent(logPad + "   ", logLevel, taskItem.taskFile);

        //
        // Fire change event for the 'Last Tasks' folder if the task exists there
        //
        if (this.specialFolders.lastTasks.hasTask(taskItem))
        {   //
            // 'Last Tasks' folder, if enabled, will always be the 1st tree item
            //
            this.wrapper.treeManager.fireTreeRefreshEvent(logPad + "   ", logLevel, taskTree[0]);
        }

        //
        // Fire change event for the 'Favorites' folder if the task exists there
        //
        if (this.specialFolders.favorites.hasTask(taskItem))
        {   //
            // 'Favorites' folder, if enabled, can be the 1st tree item or 2d, depending on if
            // the 'Last Tasks' folder is enabled, which is always the 1st item in the tree if enabled
            //
            if (taskTree[0] && taskTree[0].label === this.specialFolders.favorites.label)
            {
                this.wrapper.treeManager.fireTreeRefreshEvent(logPad + "   ", logLevel, taskTree[0]);
            }
            else {
                this.wrapper.treeManager.fireTreeRefreshEvent(logPad + "   ", logLevel, taskTree[1]);
            }
        }

        this.wrapper.log.methodDone("fire task change events", logLevel, logPad);
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
                this.statusBarSpace.text = "$(loading~spin) " + statusMsg;
                this.statusBarSpace.show();
            }
            else {
                this.wrapper.log.methodStart("   found idle/stopped task, hide status message", 2, logPad);
                this.statusBarSpace.hide();
            }
        }
        this.wrapper.log.methodDone("task start/stop show/hide message", 2, logPad);
    }


    // private taskProcessStartEvent = (e: TaskProcessStartEvent) => this.taskStartEvent({ execution: e.execution });


    // private taskProcessFinishedEvent = (e: TaskProcessEndEvent) => this.taskFinishedEvent({ execution: e.execution });


    private async taskStartEvent(e: TaskStartEvent): Promise<void>
    {
        const taskMap = this.wrapper.treeManager.getTaskMap(),
              taskTree = this.wrapper.treeManager.getTaskTree(),
              task = e.execution.task,
              treeId = task.definition.taskItemId,
              isMapEmpty = this.wrapper.utils.isObjectEmpty(taskMap);

        this.wrapper.log.methodStart("task started event", 1, "", false, [[ "task name", task.name ], [ "task id", treeId ]]);

        //
        // If taskMap is empty, then this view has not yet been made visible, an there's nothing
        // to update.  The `taskTree` property should also be null.  We could probably do this
        // before the timer check above, but hey, just in case taskMap goes empty between events
        // for some un4seen reason.
        //
        if (isMapEmpty || !taskMap[treeId])
        {
            /* istanbul ignore if */ /* istanbul ignore next */
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
            this.fireTaskChangeEvents(taskItem, "   ", 1);
            const iTask = this.wrapper.taskUtils.toITask(this.wrapper.usage, [ task ], "running")[0];
            this._onTaskStatusChange.fire({ task: iTask, treeId, isRunning: true });
            this._onDidRunningTasksChange.fire({ tasks: [], task: iTask, treeId, isRunning: true });
        }

        this.wrapper.log.methodDone("task started event", 1);
    }


    private async taskFinishedEvent(e: TaskEndEvent): Promise<void>
    {
        const taskMap = this.wrapper.treeManager.getTaskMap(),
              taskTree = this.wrapper.treeManager.getTaskTree(),
              task = e.execution.task,
              treeId = task.definition.taskItemId,
              isMapEmpty = this.wrapper.utils.isObjectEmpty(taskMap);

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
            /* istanbul ignore if */ /* istanbul ignore next */
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
            this.fireTaskChangeEvents(taskMap[treeId] as TaskItem, "   ", 1);
            const iTask = this.wrapper.taskUtils.toITask(this.wrapper.usage, [ task ], "running")[0];
            this._onTaskStatusChange.fire({ task: iTask, treeId, isRunning: false });
            this._onDidRunningTasksChange.fire({ tasks: [], task: iTask, treeId, isRunning: false });
        }

        this.wrapper.log.methodDone("task finished event", 1);
    }

}

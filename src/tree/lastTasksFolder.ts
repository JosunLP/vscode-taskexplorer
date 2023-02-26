
import { TaskItem } from "./item";
import { log } from "../lib/log/log";
import { Strings } from "../lib/constants";
import { TaskTreeManager } from "./treeManager";
import { TreeItemCollapsibleState } from "vscode";
import { SpecialTaskFolder } from "./specialFolder";
import { configuration } from "../lib/utils/configuration";
import { Commands, registerCommand } from "../lib/command/command";


/**
 * @class LastTaskFolder
 *
 * @since 3.0.0
 */
export class LastTasksFolder extends SpecialTaskFolder
{

    constructor(treeManager: TaskTreeManager, state: TreeItemCollapsibleState)
    {
        super(treeManager, Strings.LAST_TASKS_LABEL, state);
        this.disposables.push(registerCommand(Commands.ClearLastTasks, () => this.clearSavedTasks(), this));
    }


    protected onTaskSave = (taskItem: TaskItem, logPad: string) =>
    {
        /* istanbul ignore if */
        if (!taskItem.task) {
            return;
        }
        //
        // Push task to top of list
        //
        const taskId = this.label + ":" + this.getTaskItemId(taskItem.id);
        let taskItem2 = this.taskFiles.find(t => t instanceof TaskItem && t.id === taskId);
        /* istanbul ignore else */
        if (taskItem2)
        {
            this.removeTaskFile(taskItem2, logPad + "   ", false);
        }
        else if (this.taskFiles.length >= configuration.get<number>("specialFolders.numLastTasks"))
        {
            this.removeTaskFile(this.taskFiles[this.taskFiles.length - 1], logPad + "   ", false);
        }
        if (!taskItem2)
        {
            taskItem2 = new TaskItem(taskItem.taskFile, taskItem.task, logPad + "   ");
            taskItem2.id = taskId;
            taskItem2.label = this.getRenamedTaskName(taskItem2);
            taskItem2.folder = this;
        }
        log.value(logPad + "   add item", taskItem2.id, 2);
        this.insertTaskFile(taskItem2, 0);
        this.treeManager.fireTreeRefreshEvent("   ", 1, this);
    };


    protected override sort = (logPad: string) =>
    {
        log.methodStart("sort last tasks", 4, logPad);
        this.taskFiles?./* istanbul ignore else */sort((a: TaskItem, b: TaskItem) =>
        {
            const aIdx = this.store.indexOf(a.id.replace(Strings.LAST_TASKS_LABEL + ":", ""));
            const bIdx = this.store.indexOf(b.id.replace(Strings.LAST_TASKS_LABEL + ":", ""));
            return aIdx < bIdx ? 1 : -1;
        });
        log.methodDone("sort last tasks", 4, logPad);
    };

}

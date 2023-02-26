
import { TaskItem } from "./item";
import { Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./treeManager";
import { isPinned } from "../lib/utils/taskUtils";
import { SpecialTaskFolder } from "./specialFolder";
import { TreeItemCollapsibleState, window } from "vscode";
import { Commands, registerCommand } from "../lib/command/command";
import { TeTaskListType } from "src/interface";


/**
 * @class LastTaskFolder
 *
 * @since 3.0.0
 */
export class LastTasksFolder extends SpecialTaskFolder
{
    protected listType: TeTaskListType = "last";

    constructor(wrapper: TeWrapper, treeManager: TaskTreeManager, state: TreeItemCollapsibleState)
    {
        super(wrapper, treeManager, Strings.LAST_TASKS_LABEL, state);
        this.disposables.push(registerCommand(Commands.ClearLastTasks, () => this.clearSavedTasks(), this));
    }


    getLastRanId = () =>
    {
        let lastTaskId: string | undefined;
        if (this.store.length > 0)
        {
            lastTaskId = this.store[this.store.length - 1];
        }
        if (!lastTaskId)
        {
            window.showInformationMessage("No saved tasks!");
        }
        return lastTaskId;
    };


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
        else if (this.taskFiles.length >= this.wrapper.config.get<number>("specialFolders.numLastTasks"))
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
        this.wrapper.log.value(logPad + "   add item", taskItem2.id, 2);
        this.insertTaskFile(taskItem2, 0);
        this.treeManager.fireTreeRefreshEvent("   ", 1, this);
    };


    protected override sort = () =>
    {
        this.taskFiles?./* istanbul ignore else */sort((a: TaskItem, b: TaskItem) =>
        {
            const aId = this.getTaskItemId(a.id),
                  bId = this.getTaskItemId(b.id),
                  aIdx = this.store.indexOf(aId),
                  bIdx = this.store.indexOf(bId),
                  aIsPinned = isPinned(aId,  "last"),
                  bIsPinned = isPinned(bId, "last");
            if (aIsPinned && !bIsPinned) {
                return -1;
            }
            else if (!aIsPinned && bIsPinned) {
                return 1;
            }
            return aIdx < bIdx ? 1 : -1;
        });
    };

}

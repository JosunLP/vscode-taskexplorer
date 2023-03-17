
import { TaskItem } from "./item";
import { Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { StorageTarget, TeTaskListType } from "../interface";
import { TaskTreeManager } from "./treeManager";
import { isPinned } from "../lib/utils/taskUtils";
import { SpecialTaskFolder } from "./specialFolder";
import { ConfigurationChangeEvent, TreeItemCollapsibleState, window } from "vscode";
import { Commands, registerCommand } from "../lib/command/command";


/**
 * @class LastTaskFolder
 *
 * @since 3.0.0
 */
export class LastTasksFolder extends SpecialTaskFolder
{

    protected maxItems: number;
    protected listType: TeTaskListType = "last";


    constructor(wrapper: TeWrapper, treeManager: TaskTreeManager, state: TreeItemCollapsibleState)
    {
        super(wrapper, treeManager, Strings.LAST_TASKS_STORE, Strings.LAST_TASKS_LABEL, state);
        this.maxItems = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFolders.NumLastTasks);
        this.disposables.push(
            registerCommand(Commands.ClearLastTasks, () => this.clearSavedTasks(), this)
        );
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


    protected override async onConfigChanged(e: ConfigurationChangeEvent)
    {
        if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.SpecialFolders.NumLastTasks))
        {
            this.maxItems = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFolders.NumLastTasks);
        }
        await super.onConfigChanged(e);
    }


    private onTaskSave = (taskItem: TaskItem, logPad: string) =>
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
            this.removeTaskFile(taskItem2, logPad, false);
        }
        else if (this.taskFiles.length >= this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFolders.NumLastTasks))
        {
            this.removeTaskFile(this.taskFiles[this.taskFiles.length - 1], logPad, false);
        }
        if (!taskItem2)
        {
            taskItem2 = new TaskItem(taskItem.taskFile, taskItem.task, logPad);
            taskItem2.id = taskId;
            taskItem2.label = this.getRenamedTaskName(taskItem2);
            taskItem2.folder = this;
        }
        this.wrapper.log.value("   add item", taskItem2.id, 2, logPad);
        this.insertTaskFile(taskItem2, 0);
        this.treeManager.fireTreeRefreshEvent(this, logPad);
    };


    saveTask = async (taskItem: TaskItem, logPad: string) =>
    {
        const taskId = this.getTaskItemId(taskItem.id);
        this.log.methodStart("save task", 1, logPad, false, [
            [ "treenode label", this.label ], [ "max tasks", this.maxItems ],
            [ "task id", taskId ], [ "current # of saved tasks", this.store.length ]
        ]);
        this.log.value("current saved task ids", this.store.toString() , 3, logPad + "   ");
        this.wrapper.utils.removeFromArray(this.store, taskId); // Moving it to the top of the list it if it already exists
        while (this.store.length >= this.maxItems) {
            this.store.shift();
        }
        this.store.push(taskId);
        this.storeWs.push(taskId);
        await this.wrapper.storage.update(this.storeName, this.store);
        await this.wrapper.storage.update(this.storeName, this.storeWs, StorageTarget.Workspace);
        this.onTaskSave(taskItem, logPad);
        this.fireChangeEvent(taskItem);
        this.log.methodDone("save task", 1, logPad, [[ "new # of saved tasks", this.store.length ]]);
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

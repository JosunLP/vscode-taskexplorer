
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


    constructor(wrapper: TeWrapper, state: TreeItemCollapsibleState)
    {
        super(wrapper, Strings.LAST_TASKS_LABEL, state);
        this.maxItems = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFolders.NumLastTasks);
        this.disposables.push(
            registerCommand(Commands.ClearLastTasks, this.clearSavedTasks, this)
        );
    }


    getLastRanId = () =>
    {
        let lastTaskId: string | undefined;
        if (this.store.length > 0)
        {
            lastTaskId = this.store[this.store.length - 1].id;
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


    private pushToTop = (taskItem: TaskItem, logPad: string) =>
    {
        const taskId = this.label + ":" + this.getTaskItemId(taskItem.id);
        let taskItem2 = this.taskFiles.find(t => t instanceof TaskItem && t.id === taskId);
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
    };


    saveTask = async (taskItem: TaskItem, logPad: string) =>
    {
        const taskId = this.getTaskItemId(taskItem.id),
              now = Date.now();
        this.log.methodStart("save task", 1, logPad, false, [
            [ "treenode label", this.label ], [ "max tasks", this.maxItems ],
            [ "task id", taskId ], [ "current # of saved tasks", this.store.length ]
        ]);
        this.log.value("current saved task ids", this.store.toString() , 3, logPad + "   ");
        this.wrapper.utils.removeFromArray(this.store, taskId); // Moving it to the top of the list it if it already exists
        while (this.store.length >= this.maxItems) {
            this.store.shift();
        }
        this.store.push({ id: taskId, timestamp: now });
        this.storeWs.push({ id: taskId, timestamp: now });
        await this.saveStores();
        this.pushToTop(taskItem, logPad);
        this.fireChangeEvent(taskItem);
        this.wrapper.treeManager.fireTreeRefreshEvent(this, null, logPad);
        this.log.methodDone("save task", 1, logPad, [[ "new # of saved tasks", this.store.length ]]);
    };

}

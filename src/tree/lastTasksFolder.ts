
import { TaskItem } from "./item";
import { TeWrapper } from "../lib/wrapper";
import { TeTaskListType } from "../interface";
import { SpecialTaskFolder } from "./specialFolder";
import { Commands, registerCommand } from "../lib/command/command";
import { ConfigurationChangeEvent, TreeItemCollapsibleState, window } from "vscode";


/**
 * @class LastTaskFolder
 *
 * @since 3.0.0
 */
export class LastTasksFolder extends SpecialTaskFolder
{
    protected order = 0;
    private _maxItems: number;

    constructor(wrapper: TeWrapper, state: TreeItemCollapsibleState)
    {
        super(wrapper, "last", wrapper.keys.Strings.LAST_TASKS_LABEL, wrapper.keys.Config.SpecialFolders.ShowLastTasks, state);
        this._maxItems = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFolders.NumLastTasks);
        this.disposables.push(
            registerCommand(Commands.ClearLastTasks, this.clearSavedTasks, this)
        );
    }

    protected get maxItems(): number {
        return this._maxItems;
    }


    getLastRanId = () =>
    {
        let lastTaskId: string | undefined;
        if (this.storeWs.length > 0)
        {
            lastTaskId = this.storeWs[this.storeWs.length - 1].id;
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
            this._maxItems = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFolders.NumLastTasks);
        }
        super.onConfigChanged(e);
    }


    private pushToTreeTop = (taskItem: TaskItem, logPad: string) =>
    {
        const taskId = this.getTaskSpecialId(taskItem.id);
        let taskItem2 = this.taskFiles.find(t => t instanceof TaskItem && t.id === taskId);
        if (taskItem2)
        {
            this.removeTaskFile(taskItem2, logPad, false);
        }
        else if (this.taskFiles.length >= this.maxItems)
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
        this.fireChangeEvent(taskItem2, logPad + "   ");
    };


    saveTask = async (taskItem: TaskItem, logPad: string) =>
    {
        const taskId = this.getTaskItemId(taskItem.id),
              now = Date.now();
        this.log.methodStart(`save task to ${this.labelLwr} folder`, 1, logPad, false, [
            [ "treenode label", this.label ], [ "max tasks", this.maxItems ],
            [ "task id", taskId ], [ "current # of saved tasks", this.taskFiles.length ]
        ]);
        this.removeFromStore(taskItem);
        this.store.push({ id: taskId, timestamp: now });
        this.storeWs.push({ id: taskId, timestamp: now });
        await this.saveStores();
        this.pushToTreeTop(taskItem, logPad + "   ");
        this.log.methodDone(`save task to ${this.labelLwr} folder`, 1, logPad, [[ "new # of saved tasks", this.taskFiles.length ]]);
    };


    protected override sort = () =>
    {
        const cStore = this.getCombinedStore();
        this.taskFiles.sort((a: TaskItem, b: TaskItem) =>
        {
            const aId = this.getTaskItemId(a.id),
                  bId = this.getTaskItemId(b.id),
                  aIdx = cStore.findIndex(t => t.id === aId),
                  bIdx = cStore.findIndex(t => t.id === bId),
                  aIsPinned = this.wrapper.taskUtils.isPinned(aId, this.listType),
                  bIsPinned = this.wrapper.taskUtils.isPinned(bId, this.listType);
            if (aIsPinned && !bIsPinned) {
                return -1;
            }
            else if (!aIsPinned && bIsPinned) {
                return 1;
            }
            return aIdx < bIdx ? -1 : /* istanbul ignore next */1;
        });
    };

}

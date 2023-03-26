
import { TaskItem } from "./item";
import { TeWrapper } from "../lib/wrapper";
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


    protected override onConfigChanged(e: ConfigurationChangeEvent)
    {
        if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.SpecialFolders.NumLastTasks))
        {
            this._maxItems = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFolders.NumLastTasks);
        }
        super.onConfigChanged(e);
    }


    private pushToTreeTop = async (taskItem: TaskItem, logPad: string) =>
    {
        const taskId = this.getTaskSpecialId(taskItem.id);
        let taskItem2 = this.taskFiles.find(t => t instanceof TaskItem && t.id === taskId);
        if (taskItem2)
        {
            await this.removeTaskFile(taskItem2, logPad, false);
        }
        else if (this.taskFiles.length >= this.maxItems)
        {
            await this.removeTaskFile(this.taskFiles[this.taskFiles.length - 1], logPad, false);
        }
        if (!taskItem2) {
            taskItem2 = this.createTaskItem(taskItem, logPad + "   ");
        }
        this.insertTaskFile(taskItem2, 0);
        this.fireChangeEvent(taskItem2, false, logPad + "   "); // running task watcher will fire tree refresh
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
        await this.pushToTreeTop(taskItem, logPad + "   ");
        this.log.methodDone(`save task to ${this.labelLwr} folder`, 1, logPad, [[ "new # of saved tasks", this.taskFiles.length ]]);
    };


    protected override sort = () =>
    {
        this.taskFiles.sort((a: TaskItem, b: TaskItem) =>
        {
            const aIsPinned = this.wrapper.taskUtils.isPinned(this.getTaskItemId(a.id), this.listType),
                  bIsPinned = this.wrapper.taskUtils.isPinned(this.getTaskItemId(b.id), this.listType);
            return bIsPinned && !aIsPinned ? 1 : -1;
        });
    };

}

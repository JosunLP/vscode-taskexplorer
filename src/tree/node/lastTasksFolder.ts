
import { TaskItem } from "./item";
import { TeWrapper } from "../../lib/wrapper";
import { SpecialTaskFolder } from "./specialFolder";
import { ITeTaskStatusChangeEvent } from "../../interface";
import { registerCommand } from "../../lib/command/command";
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
        super(wrapper, "last", wrapper.keys.Strings.LAST_TASKS_LABEL, wrapper.keys.Config.SpecialFoldersShowLastTasks, state);
        this._maxItems = wrapper.config.get<number>(wrapper.keys.Config.SpecialFoldersNumLastTasks, 10);
        this.disposables.push(
            wrapper.taskWatcher.onDidTaskStatusChange(this.onTaskStatusChanged, this),
            registerCommand(wrapper.keys.Commands.ClearLastTasks, this.clearSavedTasks, this)
        );
    }


    protected get maxItems(): number { return this._maxItems; }


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
        if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.SpecialFoldersNumLastTasks))
        {
            this._maxItems = this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFoldersNumLastTasks, 10);
        }
        super.onConfigChanged(e);
    }


    private onTaskStatusChanged = (_e: ITeTaskStatusChangeEvent) => { /* TODO - Double check status updated */ };


    private pushToTreeTop = async (taskItem: TaskItem) =>
    {
        const logPad = this.wrapper.log.lastPad,
              taskId = this.getTaskSpecialId(taskItem.id);
        let taskItem2 = this.treeNodes.find(t => t.id === taskId);
        if (taskItem2)
        {
            taskItem2 = await this.removeChild(taskItem2, logPad, false);
        }
        else if (this.treeNodes.length >= this.maxItems)
        {
            await this.removeChild(this.treeNodes[this.treeNodes.length - 1], logPad, false);
        }
        if (!taskItem2) {
            taskItem2 = this.createTaskItem(taskItem, logPad + "   ");
        }
        this.addChild(taskItem2, 0);
        this.fireChangeEvent(taskItem2, false, logPad + "   "); // running task watcher will fire tree refresh
    };


    saveTask = async (taskItem: TaskItem) =>
    {
        const taskId = this.getTaskItemId(taskItem.id),
              now = Date.now();
        this.removeFromStore(taskItem);
        this.store.push({ id: taskId, timestamp: now });
        this.storeWs.push({ id: taskId, timestamp: now });
        await this.saveStores();
        await this.pushToTreeTop(taskItem);
        return taskItem;
    };


    override sort = () =>
    {
        this.treeNodes.sort((a: TaskItem, b: TaskItem) =>
        {
            const aIsPinned = this.wrapper.taskUtils.isPinned(this.getTaskItemId(a.id), this.listType),
                  bIsPinned = this.wrapper.taskUtils.isPinned(this.getTaskItemId(b.id), this.listType);
            return bIsPinned && !aIsPinned ? 1 : -1;
        });
    };

}

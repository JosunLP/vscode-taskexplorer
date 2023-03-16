
import { TaskItem } from "./item";
import { Strings } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { TaskTreeManager } from "./treeManager";
import { TreeItemCollapsibleState } from "vscode";
import { SpecialTaskFolder } from "./specialFolder";
import { ITeTask, StorageTarget, TeTaskListType } from "../interface";
import { Commands, registerCommand } from "../lib/command/command";


/**
 * @class FavoritesFolder
 *
 * @since 3.0.0
 */
export class FavoritesFolder extends SpecialTaskFolder
{

    protected maxItems = Infinity;
    protected listType: TeTaskListType = "favorites";


    constructor(wrapper: TeWrapper, treeManager: TaskTreeManager, state: TreeItemCollapsibleState)
    {
        super(wrapper, treeManager, Strings.FAV_TASKS_STORE, Strings.FAV_TASKS_LABEL, state);
        this.disposables.push(
            registerCommand(Commands.AddRemoveFavorite, (taskItem: TaskItem | ITeTask) => this.addRemoveFavorite(this.treeManager.getTaskItem(taskItem)), this),
            registerCommand(Commands.ClearFavorites, () => this.clearSavedTasks(), this)
        );
    }


    /**
     * @method addRemoveFavorite
     * @since 2.0.0
     *
     * Adds/removes tasks from the Favorites List.  Basically a toggle, if the task exists as a
     * favorite already when this function is called, it gets removed, if it doesnt exist, it gets added.
     *
     * @param taskItem The representative TaskItem of the task to add/remove
     */
    private async addRemoveFavorite(taskItem: TaskItem)
    {
        let removed = false;
        const id = this.getTaskItemId(taskItem.id);

        this.wrapper.log.methodStart("add/remove " + this.contextValue, 1, "", false, [
            [ "id", taskItem.id ], [ "current fav count", this.store.length ]
        ]);

        //
        // If this task exists in the store, remove it, if it doesnt, then add it
        //
        let idx = this.store.findIndex(f => f === id);
        if (idx === -1) {
            idx = this.storeWs.findIndex(f => f === id);
        }
        if (idx === -1) {
            await this.saveTask(taskItem, "   ");
        }
        else {
           await this.removeTaskFile(`${Strings.FAV_TASKS_LABEL}:${id}`, "   ", true);
           removed = true;
        }

        this.wrapper.log.methodDone("add/remove favorite", 1);
        return removed;
    }


    saveTask = async (taskItem: TaskItem, logPad: string) =>
    {
        const taskId = this.getTaskItemId(taskItem.id);
        this.log.methodStart("save task", 1, logPad, false, [
            [ "treenode label", this.label ], [ "task id", taskId ], [ "current # of saved tasks", this.store.length ]
        ]);
        this.store.push(taskId);
        this.storeWs.push(taskId);
        await this.wrapper.storage.update(this.storeName, this.store, StorageTarget.Global);
        await this.wrapper.storage.update(this.storeName, this.storeWs, StorageTarget.Workspace);
        await this.addTaskFile(taskItem, logPad);
        this.fireChangeEvent(taskItem);
        this.log.methodDone("save task", 1, logPad, [[ "new # of saved tasks", this.store.length ]]);
    };

}

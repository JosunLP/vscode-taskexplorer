
import { TaskItem } from "./item";
import { ITeTask } from "../../interface";
import { TeWrapper } from "../../lib/wrapper";
import { TreeItemCollapsibleState } from "vscode";
import { SpecialTaskFolder } from "./specialFolder";
import { registerCommand } from "../../lib/command/command";


/**
 * @class FavoritesFolder
 *
 * @since 3.0.0
 */
export class FavoritesFolder extends SpecialTaskFolder
{
    protected order = 1;
    private _maxItems: number;


    constructor(wrapper: TeWrapper, stamp: number, state: TreeItemCollapsibleState)
    {
        super(wrapper, "favorites", wrapper.keys.Strings.FAV_TASKS_LABEL, wrapper.keys.Config.SpecialFoldersShowFavorites, stamp, state);
        this._maxItems = 100; // this.wrapper.config.get<number>(this.wrapper.keys.Config.SpecialFoldersNumLastTasks);
        this.disposables.push(
            registerCommand(wrapper.keys.Commands.AddRemoveFavorite, this.addRemoveFavorite, this),
            registerCommand(wrapper.keys.Commands.ClearFavorites, this.clearSavedTasks, this)
        );
    }


    protected get maxItems(): number { return this._maxItems; }


    /**
     * @method addRemoveFavorite
     * @since 2.0.0
     *
     * Adds/removes tasks from the Favorites List.  Basically a toggle, if the task exists as a
     * favorite already when this function is called, it gets removed, if it doesnt exist, it gets added.
     *
     * @param item The representative TaskItem of the task to add/remove
     */
    private async addRemoveFavorite(item: TaskItem | ITeTask)
    {
        const taskItem = this.wrapper.treeManager.getTaskItem(item),
              id = this.getTaskItemId(taskItem.id);

        this.wrapper.log.methodStart("add/remove " + this.contextValue, 1, "", false, [
            [ "id", taskItem.id ], [ "current fav count", this.store.length ]
        ]);

        //
        // If this task exists in the store, remove it, if it doesnt, then add it
        //
        let idx = this.store.findIndex(f => f.id === id);
        if (idx === -1) {
            idx = this.storeWs.findIndex(f => f.id === id);
        }
        if (idx === -1) {
            await this.saveTask(taskItem, "   ");
        }
        else {
           await this.removeChild(taskItem, "   ", true);
        }

        this.wrapper.log.methodDone("add/remove favorite", 1);
        return idx !== -1;
    }


    private saveTask = async (taskItem: TaskItem, logPad: string) =>
    {
        const now = Date.now(),
              taskId = this.getTaskItemId(taskItem.id);
        this.log.methodStart("save task", 1, logPad, false, [
            [ "treenode label", this.label ], [ "task id", taskId ], [ "current # of store tasks", this.store.length + this.storeWs.length ]
        ]);
        this.store.push({ id: taskId, timestamp: now });
        this.storeWs.push({ id: taskId, timestamp: now });
        await this.saveStores();
        const taskItem2 = this.createTaskItem(taskItem, logPad + "   ");
        this.addChild(taskItem2, 0);
        this.sort();
        this.fireChangeEvent(taskItem, true, logPad);
        this.log.methodDone("save task", 1, logPad, [[ "new # of saved tasks", this.store.length + this.storeWs.length ]]);
    };

}

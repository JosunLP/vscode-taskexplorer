
import { TaskItem } from "./item";
import { log } from "../lib/log/log";
import { Strings } from "../lib/constants";
import { TaskTreeManager } from "./treeManager";
import { TreeItemCollapsibleState } from "vscode";
import { SpecialTaskFolder } from "./specialFolder";
import { Commands, registerCommand } from "../lib/command/command";


/**
 * @class FavoritesFolder
 *
 * @since 3.0.0
 */
export class FavoritesFolder extends SpecialTaskFolder
{

    constructor(treeManager: TaskTreeManager, state: TreeItemCollapsibleState)
    {
        super(treeManager, Strings.FAV_TASKS_LABEL, state);
        this.disposables.push(
            registerCommand(Commands.AddRemoveFavorite, (taskItem: TaskItem) => this.addRemoveFavorite(taskItem), this),
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

        log.methodStart("add/remove " + this.contextValue, 1, "", false, [
            [ "id", taskItem.id ], [ "current fav count", this.store.length ]
        ]);

        //
        // If this task exists in the store, remove it, if it doesnt, then add it
        //
        const idx = this.store.findIndex(f => f === id);
        if (idx === -1)
        {
            await this.saveTask(taskItem, "   ");
        }
        else {
           await this.removeTaskFile(`${Strings.FAV_TASKS_LABEL}:${id}`, "   ", true);
           removed = true;
        }

        log.methodDone("add/remove favorite", 1);
        return removed;
    }


    protected async onTaskSave(taskItem: TaskItem, logPad: string): Promise<void> {}

}

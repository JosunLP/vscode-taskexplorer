
import { Strings } from "../lib/constants";
import { TaskTreeManager } from "./treeManager";
import { TreeItemCollapsibleState } from "vscode";
import { SpecialTaskFolder } from "./specialFolder";

/**
 * @class FavoritesTaskFolder
 *
 * @since 3.0.0
 */
export class LastTasksFolder extends SpecialTaskFolder
{
    constructor(treeManager: TaskTreeManager, state: TreeItemCollapsibleState)
    {
        super(treeManager, Strings.LAST_TASKS_LABEL, state);
    }
}

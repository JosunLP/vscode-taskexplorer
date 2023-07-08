
import { IDictionary } from ":types";
import { Strings } from "../constants";
import { isPinned } from "./taskUtils";
import { TreeItemLabel } from "vscode";
import { TaskItem } from "../../tree/item";
import { TaskFile } from "../../tree/file";
import { TaskFolder } from "../../tree/folder";
import { configuration } from "../configuration";
import { TeTaskListType, ConfigKeys } from "../../interface";


export const sortFolders = (folders: IDictionary<TaskFolder>): TaskFolder[] =>
{
    return [ ...Object.values(folders) ].sort((a: TaskFolder, b: TaskFolder) =>
    {
        if (a.label === Strings.LAST_TASKS_LABEL) {
            return -1;
        }
        else if (b.label === Strings.LAST_TASKS_LABEL) {
            return 1;
        }
        else if (a.label === Strings.FAV_TASKS_LABEL) {
            return -1;
        }
        else if (b.label === Strings.FAV_TASKS_LABEL) {
            return 1;
        }
        else if (a.label === Strings.USER_TASKS_LABEL) {
            return -1;
        }
        else if (b.label === Strings.USER_TASKS_LABEL) {
            return 1;
        }
        if (a.label && b.label && configuration.get<boolean>(ConfigKeys.SortProjectFoldersAlphabetically)) {
            return a.label.toString().localeCompare(b.label.toString());
        }
        return 0;
    });
};


export const sortTaskFolder = (folder: TaskFolder, listType: TeTaskListType) =>
{
    sortTasks(folder.taskFiles, listType);
    for (const each of folder.taskFiles.filter(t => t instanceof TaskFile) as TaskFile[])
    {
        sortTasks(each.treeNodes, listType);
    }
};


export const sortTasks = (items: (TaskFile | TaskItem)[] | undefined, listType: TeTaskListType) =>
{
    items?.sort((a: TaskFile | TaskItem, b: TaskFile | TaskItem) =>
    {               // TaskFiles are kept at the top, like a folder in Windows
        let s = -1; // Explorer (b instanceof TaskItem && a instanceof TaskFile)
        const labelA = (a.label as string | TreeItemLabel).toString(),
              labelB = (b.label as string | TreeItemLabel).toString();
        if (a instanceof TaskFile && b instanceof TaskFile)
        {
            s = labelA.localeCompare(labelB);
        }
        else if (a instanceof TaskItem && b instanceof TaskItem)
        {
            const aIsPinned = isPinned(a.id,  listType),
                    bIsPinned = isPinned(b.id, listType);
            if (aIsPinned && !bIsPinned) {
                s = -1;
            }
            else if (!aIsPinned && bIsPinned) {
                s = 1;
            }
            else {
                s = labelA.localeCompare(labelB);
            }
        }
        else /* istanbul ignore else */ if (a instanceof TaskItem) // TaskFiles are kept at the top, like a folder in Windows Explorer
        {
            s = 1;
        }
        return s;
    });
};

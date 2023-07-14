
import { IDictionary } from ":types";
import { Strings } from "../constants";
import { isPinned } from "./taskUtils";
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
    sortTasks(folder.treeNodes, listType);
    for (const taskFile of folder.treeNodes.filter((t): t is TaskFile => TaskFile.is(t)))
    {
        sortTasks(taskFile.treeNodes, listType);
    }
};


export const sortTasks = (items: (TaskFile | TaskItem)[], listType: TeTaskListType) =>
{
    for (const item of items.filter((i): i is TaskFile => TaskFile.is(i)))
    {
        sortTasks(item.treeNodes, listType);
    }
    items.sort((a: TaskFile | TaskItem, b: TaskFile | TaskItem) =>
    {
        let s = -1;
        if (TaskFile.is(a) && TaskFile.is(b))
        {
            s = a.label.localeCompare(b.label);
        }
        else if (TaskItem.is(a) && TaskItem.is(b))
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
                s = a.label.localeCompare(b.label);
            }
        }
        else /* istanbul ignore else */ if (TaskItem.is(a))
        {
            s = 1; // TaskFiles are kept at the top, like a folder in Windows Explorer
        }
        return s;
    });
};

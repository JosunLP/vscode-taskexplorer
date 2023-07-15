
import { TaskItem } from "./item";
import { TaskFile } from "./file";
import { TaskFolder } from "./folder";
import { TeWrapper } from "../lib/wrapper";
import { isPinned } from "../lib/utils/taskUtils";
import { ITeTreeSorter, TeTaskListType } from "../interface";


export class TeTreeSorter implements ITeTreeSorter
{

    constructor(private readonly wrapper: TeWrapper) {}


    sortFolders = (folders: TaskFolder[]): void =>
    {
        const w = this.wrapper,
              sortAlpha = w.config.get<boolean>(w.keys.Config.SortProjectFoldersAlphabetically);
        folders.sort((a: TaskFolder, b: TaskFolder) =>
        {
            if (a.label === w.keys.Strings.LAST_TASKS_LABEL) {
                return -1;
            }
            else if (b.label === w.keys.Strings.LAST_TASKS_LABEL) {
                return 1;
            }
            else if (a.label === w.keys.Strings.FAV_TASKS_LABEL) {
                return -1;
            }
            else if (b.label === w.keys.Strings.FAV_TASKS_LABEL) {
                return 1;
            }
            else if (a.label === w.keys.Strings.USER_TASKS_LABEL) {
                return -1;
            }
            else if (b.label === w.keys.Strings.USER_TASKS_LABEL) {
                return 1;
            }
            if (a.label && b.label && sortAlpha) {
                return a.label.toString().localeCompare(b.label.toString());
            }
            return 0;
        });
    };


    sortTaskFolder = (folder: TaskFolder, listType: TeTaskListType) =>
    {
        this.sortTasks(folder.treeNodes, listType);
        for (const taskFile of folder.treeNodes.filter((t): t is TaskFile => TaskFile.is(t)))
        {
            this.sortTasks(taskFile.treeNodes, listType);
        }
    };


    sortTasks = (items: (TaskFile | TaskItem)[], listType: TeTaskListType) =>
    {
        for (const item of items.filter((i): i is TaskFile => TaskFile.is(i)))
        {
            this.sortTasks(item.treeNodes, listType);
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

}

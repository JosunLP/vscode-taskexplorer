
import { TaskItem } from "./item";
import { TaskFile } from "./file";
import { isString } from "../lib/utils/typeUtils";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, WorkspaceFolder } from "vscode";


/**
 * @class TaskFolder
 *
 * A tree node that represents a workspace folder.
 * An item of this type is a "root folder" in the tree, it contains various TaskItem and TaskItem nodes.
 */
export class TaskFolder extends TreeItem
{
    public override id: string;
    public override label: string;
    public taskFiles: (TaskFile|TaskItem)[] = [];
    public workspaceFolder: WorkspaceFolder | undefined;


    constructor(folder: WorkspaceFolder | string, state: TreeItemCollapsibleState)
    {
        super(isString(folder) ? folder  : folder.name, state);

        this.contextValue = "folder";

        if (!isString(folder))
        {   // 'SpecialFolder' will have string type i.e. "Favorites", "Last Tasks", "User Tasks"
            this.workspaceFolder = folder;
            this.resourceUri = folder.uri;
        }

        this.iconPath = ThemeIcon.Folder;
        this.label = isString(folder) ? folder  : folder.name;
        this.id = "treeFolderId-" + this.label;
        this.tooltip = "A tree folder representing a workspace/project";
    }


    addTaskFile(taskFile: TaskFile|TaskItem)
    {
        this.taskFiles.push(taskFile);
    }


    insertTaskFile(taskFile: TaskFile|TaskItem, index: number)
    {
        this.taskFiles.splice(index, 0, taskFile);
    }


    removeTaskFile(taskFile: TaskFile|TaskItem|string, logPad: string)
    {
        const id = isString(taskFile) ? /* istanbul ignore next */ taskFile : taskFile.id;
        const idx = this.taskFiles.findIndex(f => f.id === id);
        this.taskFiles.splice(idx, 1);
    }
}

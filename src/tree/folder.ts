
import { TaskItem } from "./item";
import { TaskFile } from "./file";
import { encodeUtf8Hex } from ":env/hex";
import { ITaskFolder } from "../interface";
import { isString } from "../lib/utils/typeUtils";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, WorkspaceFolder } from "vscode";


/**
 * @class TaskFolder
 *
 * A tree node that represents a workspace folder.
 * An item of this type is a "root folder" in the tree, it contains various TaskItem and TaskItem nodes.
 */
export class TaskFolder extends TreeItem implements ITaskFolder
{
    public override id: string;
    public override label: string;
    public isSpecial: boolean;
    public taskFiles: (TaskFile|TaskItem)[] = [];
    public workspaceFolder: WorkspaceFolder | undefined;


    constructor(folder: WorkspaceFolder | string, state: TreeItemCollapsibleState, isSpecial?: boolean)
    {
        super(isString(folder) ? folder  : folder.name, state);

        this.contextValue = "folder";

        if (!isString(folder))
        {   // 'SpecialFolder' will have string type i.e. "Favorites", "Last Tasks", "User Tasks"
            this.workspaceFolder = folder;
            this.resourceUri = folder.uri;
        }

        this.isSpecial = !!isSpecial;
        this.iconPath = ThemeIcon.Folder;
        this.label = isString(folder) ? folder : folder.name;
        this.id = encodeUtf8Hex(this.label);
        this.tooltip = "A tree folder representing a workspace/project";
    }


    addTaskFile(taskFile: TaskFile|TaskItem) { this.taskFiles.push(taskFile); }


    insertTaskFile(taskFile: TaskFile|TaskItem, index: number) { this.taskFiles.splice(index, 0, taskFile); }


    removeTaskFile(taskFile: TaskFile|TaskItem, _logPad: string)
    {
        const idx = this.taskFiles.findIndex(f => f.id === taskFile.id);
        this.taskFiles.splice(idx, 1);
    }
}

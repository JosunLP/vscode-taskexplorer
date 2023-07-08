
import { TaskItem } from "./item";
import { TaskFile } from "./file";
import { encodeUtf8Hex } from ":env/hex";
import { ITaskFolder, OneOf } from "../interface";
import { isString } from "../lib/utils/typeUtils";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";


/**
 * @class TaskFolder
 *
 * A tree node that represents a workspace folder.
 * An item of this type is a "root folder" in the tree, it contains various TaskItem and TaskItem nodes.
 */
export class TaskFolder extends TreeItem implements ITaskFolder
{
    override id: string;
    declare label: string;
    declare resourceUri: Uri;

    readonly isSpecial: boolean;
    readonly taskFiles: (TaskFile|TaskItem)[];
    readonly workspaceFolder: WorkspaceFolder | undefined;


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
        this.taskFiles = [];
        this.tooltip = "A tree folder representing a workspace/project";
    }


    addChild<T extends (TaskFile | TaskItem)>(node: T, index?: number): OneOf<T, [ TaskFile, TaskItem ]>;
    addChild(node: TaskFile|TaskItem, idx = 0) { this.taskFiles.splice(idx, 0, node); return node; }

}

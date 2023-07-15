
import { TaskItem } from "./item";
import { TaskFile } from "./file";
import { TaskTreeNode } from "./node/base";
import { encodeUtf8Hex } from ":env/hex";
import { ITaskFolder, OneOf } from "../interface";
import { isString } from "../lib/utils/typeUtils";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";


export class TaskFolder extends TaskTreeNode implements ITaskFolder
{
    readonly isSpecial: boolean;
    readonly treeNodes: (TaskFile|TaskItem)[];
    readonly workspaceFolder: WorkspaceFolder | undefined;


    constructor(folder: WorkspaceFolder | string, stamp: number, state: TreeItemCollapsibleState, isSpecial?: boolean)
    {
        super(isString(folder) ? folder  : folder.name, stamp, state);
        this.contextValue = "folder";
        if (!isString(folder))
        {   // 'SpecialFolder' will have string type i.e. "Favorites", "Last Tasks", "User Tasks"
            this.workspaceFolder = folder;
            this.resourceUri = folder.uri;
            // this.isSpecial = true;
        }
        this.isSpecial = !!isSpecial;
        this.iconPath = ThemeIcon.Folder;
        this.label = isString(folder) ? folder : folder.name;
        this.id = encodeUtf8Hex(this.label);
        this.treeNodes = [];
        this.tooltip = "A tree folder representing a workspace/project";
    }


    addChild<T extends (TaskFile | TaskItem)>(node: T, idx?: number): OneOf<T, [ TaskFile, TaskItem ]>;
    addChild(node: TaskFile|TaskItem, idx = 0) { node.folder = this; this.treeNodes.splice(idx, 0, node); return node; }


    static is(item: any): item is TaskFolder { return item instanceof TaskFolder ; }

}

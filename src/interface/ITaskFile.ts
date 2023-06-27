
import { ITaskDefinition } from "./ITaskDefinition";
import { ITaskFolder } from "./ITaskFolder";
import { ITaskItem } from "./ITaskItem";
import { TreeItem, Uri } from "vscode";

export interface ITaskFile extends TreeItem
{
    fileName: string;
    groupLevel: number;
    readonly isGroup: boolean;
    path: string;
    resourceUri: Uri;
    readonly taskSource: string;
    treeNodes: (ITaskItem|ITaskFile)[];
    addTreeNode(treeNode: (ITaskFile | ITaskItem | undefined)): void;
    insertTreeNode(treeItem: ITaskFile|ITaskItem, index: number): void;
    removeTreeNode(treeItem: (ITaskFile | ITaskItem)): void;
}

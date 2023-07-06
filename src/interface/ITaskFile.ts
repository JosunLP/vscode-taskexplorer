
import { ITaskItem } from "./ITaskItem";
import { TreeItem, Uri } from "vscode";

export interface ITaskFile extends TreeItem
{
    readonly fileName: string;
    groupLevel: number;
    label: string;
    readonly isGroup: boolean;
    readonly relativePath: string;
    resourceUri: Uri;
    readonly taskSource: string;
    treeNodes: (ITaskItem|ITaskFile)[];
    addChild(treeNode: ITaskFile | ITaskItem, index?: number): void;
    removeChild(treeItem: ITaskFile | ITaskItem): void;
}

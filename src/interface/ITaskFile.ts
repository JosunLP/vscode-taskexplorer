
import { OneOf } from "./ITeUtilities";
import { ITaskItem } from "./ITaskItem";
import { ITaskFolder } from "./ITaskFolder";
import { Task, TreeItem, Uri } from "vscode";

export interface ITaskFile extends TreeItem
{
    // groupId: string | undefined;
    groupLevel: number;
    id: string;
    isGroup: boolean;
    label: string;
    fileName: string;
    readonly task: Task;
    readonly isUser: boolean;
    readonly relativePath: string;
    readonly resourceUri: Uri;
    readonly taskSource: string;
    readonly folder: ITaskFolder | undefined;
    readonly treeNodes: (ITaskItem|ITaskFile)[];
    addChild<T extends (ITaskFile | ITaskItem)>(node: T, index?: number): OneOf<T, [ ITaskFile, ITaskItem ]>;
    addChild(treeNode: ITaskFile | ITaskItem, index?: number): ITaskFile | ITaskItem;
    removeChild(treeItem: ITaskFile | ITaskItem): void;
}

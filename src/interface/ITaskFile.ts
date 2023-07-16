
import { OneOf } from "./ITeUtilities";
import { ITaskItem } from "./ITaskItem";
import { TeTaskSource } from "./ITeTask";
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
    folder: ITaskFolder;
    // readonly task: Task;
    readonly isUser: boolean;
    readonly relativePath: string;
    readonly taskSource: TeTaskSource;
    readonly treeNodes: (ITaskItem|ITaskFile)[];
    readonly uri: Uri;
    addChild<T extends (ITaskFile | ITaskItem)>(node: T, index?: number): OneOf<T, [ ITaskFile, ITaskItem ]>;
    addChild(treeNode: ITaskFile | ITaskItem, index?: number): ITaskFile | ITaskItem;
}


import { OneOf } from "./ITeUtilities";
import { ITaskFile } from "./ITaskFile";
import { ITaskItem } from "./ITaskItem";
import { TreeItem, WorkspaceFolder } from "vscode";

export interface ITaskFolder extends TreeItem
{
    id: string;
    label: string;
    readonly isSpecial: boolean;
    readonly taskFiles: (ITaskFile|ITaskItem)[];
    readonly workspaceFolder: WorkspaceFolder | undefined;
    addChild<T extends (ITaskFile | ITaskItem)>(node: T, index?: number): OneOf<T, [ ITaskFile, ITaskItem ]>;
    addChild(taskFile: ITaskFile|ITaskItem, index?: number): ITaskFile | ITaskItem;
}

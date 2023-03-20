
import { ITaskFile } from "./ITaskFile";
import { ITaskItem } from "./ITaskItem";
import { TreeItem } from "vscode";

export interface ITaskFolder extends TreeItem
{
    addTaskFile(taskFile: ITaskFile|ITaskItem): void;
    insertTaskFile(taskFile: ITaskFile|ITaskItem, index: number): void;
    removeTaskFile(taskFile: ITaskFile | ITaskItem | string, logPad: string): void;
}


import { ITaskFile } from "./ITaskFile";
import { ITaskItem } from "./ITaskItem";
import { TreeItem } from "vscode";

export interface ITaskFolder extends TreeItem
{
    addChild(taskFile: ITaskFile|ITaskItem, index?: number): void;
    removeChild(taskFile: ITaskFile | ITaskItem, logPad: string): void | Promise<void>;
}

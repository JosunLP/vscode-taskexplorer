
import { ITaskFile } from "./ITaskFile";
import { Task, TaskExecution, TreeItem, WorkspaceFolder } from "vscode";
import { ITaskFolder } from "./ITaskFolder";

export interface ITaskItem extends TreeItem
{
    groupLevel: number;
    id: string;
    label: string;
    paused: boolean;
    taskDetached: Task | undefined;
    execution: TaskExecution | undefined;
    folder: ITaskFolder | undefined;
    readonly isUser: boolean;
    readonly task: Task;
    readonly taskFile: ITaskFile;
    readonly taskSource: string;
    isExecuting(logPad?: string): TaskExecution | undefined;
    getFolder(): WorkspaceFolder | undefined;
    refreshState(logPad: string, logLevel: number): void;
}

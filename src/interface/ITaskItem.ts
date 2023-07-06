
import { ITaskFile } from "./ITaskFile";
import { Task, TaskExecution, TreeItem, WorkspaceFolder } from "vscode";

export interface ITaskItem extends TreeItem
{
    groupLevel: number;
    readonly id: string;
    label: string;
    readonly isUser: boolean;
    paused: boolean;
    readonly task: Task;
    taskDetached: Task | undefined;
    readonly taskFile: ITaskFile;
    readonly taskSource: string;
    isExecuting(logPad?: string): TaskExecution | undefined;
    getFolder(): WorkspaceFolder | undefined;
    refreshState(logPad: string, logLevel: number): void;
}

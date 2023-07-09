
import { ITaskFile } from "./ITaskFile";
import { TeTaskSource } from "./ITeTask";
import { ITaskFolder } from "./ITaskFolder";
import { Task, TaskExecution, TreeItem, WorkspaceFolder } from "vscode";

export interface ITaskItem extends TreeItem
{
    groupLevel: number;
    id: string;
    label: string;
    paused: boolean;
    folder: ITaskFolder;
    taskDetached: Task | undefined;
    execution: TaskExecution | undefined;
    readonly isUser: boolean;
    readonly task: Task;
    readonly taskFile: ITaskFile;
    readonly taskSource: TeTaskSource;
    isExecuting(logPad?: string): TaskExecution | undefined;
    getFolder(): WorkspaceFolder | undefined;
    refreshState(logPad: string, logLevel: number): void;
}

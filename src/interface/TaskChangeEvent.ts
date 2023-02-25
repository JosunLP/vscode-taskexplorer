import { Task } from "vscode";

export interface ITeTasksChangeEvent
{
    readonly type: "all" | "last" | "favorites" | "famous" | "running";
    readonly tasks: Task[];
};

export interface ITeTaskStatusChangeEvent
{
    isRunning: boolean;
    taskItemId: string;
    task: Task;
};

export interface ITeRunningTaskChangeEvent extends ITeTaskStatusChangeEvent
{
    readonly tasks: Task[];
};

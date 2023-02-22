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

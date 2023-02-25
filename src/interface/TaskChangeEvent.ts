import { Task } from "vscode";

export type TeTaskListType = "none" | "last" | "running" | "favorites" | "famous" | "all";

export interface ITeTasksChangeEvent
{
    readonly type: TeTaskListType;
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

import { Task } from "vscode";

export interface ITeTasksChangeEvent
{
    readonly taskCount: number;
};

export interface ITeTaskStatusChangeEvent
{
    isRunning: boolean;
    taskItemId: string;
    task: Task;
};

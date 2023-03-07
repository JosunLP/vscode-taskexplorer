
import { ITaskDefinition } from "./ITaskDefinition";
import { ITeTrackedUsageCount, ITaskRuntimeInfo } from "./ITeUsage";


export type TeTaskListType = "last" | "running" | "favorites" | "famous" | "all";

export interface ITeTask
{
	definition: ITaskDefinition;
	listType:  TeTaskListType;
	fsPath: string;
	name: string;
	pinned: boolean;
	runCount: ITeTrackedUsageCount;
	running: boolean;
	source: string;
	treeId: string;
	runTime: ITaskRuntimeInfo;
}

export interface ITeTaskChangeEvent
{
    type: TeTaskListType;
    tasks: ITeTask[];
    task?: ITeTask;
};

export interface ITeTaskStatusChangeEvent
{
    isRunning: boolean;
    task: ITeTask;
    treeId: string;
};

export interface ITeRunningTaskChangeEvent extends ITeTaskStatusChangeEvent
{
    tasks: ITeTask[];
};


import { ITaskDefinition } from "./ITaskDefinition";
import { ITeTrackedUsageCount } from "./ITeUsageWatcher";


export type TeTaskListType = "none" | "last" | "running" | "favorites" | "famous" | "all";

export interface ITeTask
{
	definition: ITaskDefinition;
	listType:  TeTaskListType;
	name: string;
	pinned: boolean;
	runCount: ITeTrackedUsageCount;
	running: boolean;
	source: string;
	treeId: string;
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

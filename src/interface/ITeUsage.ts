import { Event } from "vscode";
import { ITeTask } from "./ITeTask";
import { IDictionary } from "./IDictionary";

export interface ITeTrackedUsageCount
{
	today: number;
	last7Days: number;
	last14Days: number;
	last30Days: number;
	last60Days: number;
	last90Days: number;
	total: number;
	yesterday: number;
}

export interface ITaskRuntimeInfo
{
    average: number;
    fastest: number;
    first: number;
    last: number;
    slowest: number;
    avgDown: boolean;
    avgUp: boolean;
    lastDown: boolean;
    lastUp: boolean;
    newFast: boolean;
    newSlow: boolean;
}

interface ITeTaskRuntime
{
    end: number;
    start: number;
    time: number;
}

interface ITeTaskUsageRuntimeInfo extends ITaskRuntimeInfo
{
    runtimes: ITeTaskRuntime[];
}

export interface ITeTaskStats
{
    all: ITeTask[];
    famous: ITeTask[];
    favorites: ITeTask[];
    last: ITeTask[];
    running: ITeTask[];
    runtimes: IDictionary<ITeTaskUsageRuntimeInfo>;
    taskLastRan: ITeTask;
    taskMostUsed: ITeTask;
    timeLastRan: number;
}

export interface ITeTrackedUsage {
	count: ITeTrackedUsageCount;
	first: number;
	timestamp: number;
	timestamps: number[];
    taskStats?: ITeTaskUsageRuntimeInfo;
}

export interface ITeUsageChangeEvent
{
	readonly key: string;
	readonly usage?: ITeTrackedUsage;
};

export interface ITeUsage
{
	onDidChange: Event<ITeUsageChangeEvent | undefined>;
    get(key: string): ITeTrackedUsage | undefined;
    getAll(): IDictionary<ITeTrackedUsage>;
    reset(key?: string): Promise<void>;
    track(key: string): Promise<ITeTrackedUsage | undefined>;
}

/* eslint-disable @typescript-eslint/naming-convention */

import { Event } from "vscode";
import { ITeTask } from "./ITeTask";
import { IDictionary } from ":types";
import { TreeviewIds, WebviewIds, WebviewViewIds } from "./ITeWebview";

export type WebviewUsageKey = `${UsageKeys.WebviewPrefix}${WebviewIds}${string}`;
export type WebviewViewUsageKey = `${UsageKeys.WebviewViewPrefix}${WebviewViewIds}${string}`;
export type TreeviewUsageKey = `${UsageKeys.TreeviewPrefix}${TreeviewIds}${string}`;

export type AllUsageKeys = UsageKeys | WebviewUsageKey | WebviewViewUsageKey
			            | `${UsageKeys.ProviderPrefix}${string}`;

export enum UsageKeys
{
	ProviderPrefix = "taskexplorer:provider:",
	TreeviewPrefix = "taskexplorer:treeview:",
	WebviewPrefix = "taskexplorer:webview:",
	WebviewViewPrefix = "taskexplorer:webviewView:"
}

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
    getAll(key?: string): IDictionary<ITeTrackedUsage>;
    getAvgRunCount(period: "d" | "w", logPad: string): number;
    getLastRanTaskTime(): string;
    reset(key?: string): Promise<void>;
    track(key: string): Promise<ITeTrackedUsage | undefined>;
}

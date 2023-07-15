/* eslint-disable @typescript-eslint/naming-convention */

import { ITaskItem } from "./ITaskItem";
import { ITaskDefinition } from "./ITaskDefinition";
import { ITeTrackedUsageCount, ITaskRuntimeInfo } from "./ITeUsage";

export const TaskSource = [
	"ant", "apppublisher", "bash", "batch", "composer",  "gradle", "grunt", "gulp",
	"jenkins", "make", "maven", "node", "npm", "nsis", "perl", "powershell", "python",
	"pipenv", "ruby", "tsc", "webpack", "Workspace"
] as const;
export type TeTaskSource = typeof TaskSource[number];

export const TaskNonScriptType = [
	"ant", "apppublisher", "composer", "gradle", "grunt", "gulp", "jenkins", "make",
	"maven", "npm", "pipenv", "tsc", "webpack", "Workspace"
] as const;
export type TeTaskNonScriptType = typeof TaskNonScriptType[number];

export const TaskScriptType = [
	"bash", "batch", "node", "nsis", "perl", "powershell", "python", "ruby"
] as const;
export type TeTaskScriptType = typeof TaskScriptType[number];

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
	source: TeTaskSource;
	treeId: string;
	runTime: ITaskRuntimeInfo;
}

export interface ITeTaskChangeEvent
{
    type: TeTaskListType;
    tasks: ITeTask[];
    task?: ITeTask;
    taskItem?: ITaskItem;
};

export interface ITeTaskStatusChangeEvent
{
    isRunning: boolean;
    task: ITeTask;
    taskItem: ITaskItem;
    treeId: string;
};

export interface ITeRunningTaskChangeEvent extends ITeTaskStatusChangeEvent
{
    tasks: ITeTask[];
};

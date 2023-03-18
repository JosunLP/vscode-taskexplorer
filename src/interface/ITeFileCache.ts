
import { Event, Uri, WorkspaceFolder } from "vscode";

export interface ICacheItem
{
    uri: Uri;
    project: string;
    timestamp?: Date;
}

export interface ITeFileCache
{
	readonly isBusy: boolean;
    readonly onReady: Event<void>;
    addWsFolders(wsf: readonly WorkspaceFolder[] | undefined, logPad?: string): Promise<number>;
    buildTaskTypeCache(taskType: string, wsFolder: WorkspaceFolder | undefined, setCacheBuilding: boolean, logPad: string): Promise<number>;
    cancelBuildCache(): Promise<void>;
    getTaskFileCount(): number;
    getTaskFiles(taskType?: string): ICacheItem[];
    rebuildCache(logPad: string, forceForTests?: boolean): Promise<number>;
}

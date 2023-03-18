import { Task, Uri, Event } from "vscode";
import { ITaskFolder } from "./ITaskFolder";
import { ITeTaskChangeEvent } from "./ITeTask";
import { TaskMap } from "./ITeTaskManager";
import { ITaskTreeView } from "./ITeTaskTree";

export interface ITeTreeManager
{
	readonly isBusy: boolean;
    getTaskMap(): TaskMap;
    getTasks(): Task[];
    getTaskTree(): void | ITaskFolder[] | null | undefined;
    refresh(invalidate: string | false | undefined, opt: Uri | false | undefined, logPad: string): Promise<void>;
    onDidFavoriteTasksChange: Event<ITeTaskChangeEvent>;
    onDidLastTasksChange: Event<ITeTaskChangeEvent>;
    onDidTaskCountChange: Event<ITeTaskChangeEvent>;
    onDidAllTasksChange: Event<ITeTaskChangeEvent>;
    runningTasks: any[];
    views: { taskExplorer: ITaskTreeView; taskExplorerSideBar: ITaskTreeView };
}

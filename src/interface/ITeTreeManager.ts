import { Task, Uri, Event } from "vscode";
import { TaskMap } from "./ITeTaskManager";
import { ITaskFolder } from "./ITaskFolder";
import { ITaskTreeView } from "./ITeTaskTree";
import { ITeTaskChangeEvent } from "./ITeTask";
import { ITeTreeConfigWatcher } from "./ITeTreeConfigWatcher";

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
	configWatcher: ITeTreeConfigWatcher;
    views: { taskExplorer: ITaskTreeView; taskExplorerSideBar: ITaskTreeView };
}

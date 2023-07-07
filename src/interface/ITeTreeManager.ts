
import { ITaskItem } from "./ITaskItem";
import { ITaskFolder } from "./ITaskFolder";
import { ITaskTreeView } from "./ITeTaskTree";
import { Task, Uri, Event, TreeItem } from "vscode";
import { ITeTask, ITeTaskChangeEvent } from "./ITeTask";
import { ITeTreeConfigWatcher } from "./ITeTreeConfigWatcher";

export interface TaskMap<T = ITaskItem> { [id: string]: T };

export interface ITeTreeManager
{
	readonly configWatcher: ITeTreeConfigWatcher;
	readonly isBusy: boolean;
    readonly famousTasks: ITeTask[];
    readonly favoritesTasks: Task[];
    readonly lastTasks: Task[];
    readonly lastTasksFolder: ITaskFolder;
    readonly onDidFavoriteTasksChange: Event<ITeTaskChangeEvent>;
    readonly onDidLastTasksChange: Event<ITeTaskChangeEvent>;
    readonly onDidTaskCountChange: Event<ITeTaskChangeEvent>;
    readonly onDidAllTasksChange: Event<ITeTaskChangeEvent>;
    readonly onReady: Event<ITeTaskChangeEvent>;
    readonly runningTasks: any[];
    readonly tasks: Task[];
    readonly taskMap: TaskMap;
    readonly taskFolders: ITaskFolder[];
    readonly views: { taskExplorer: ITaskTreeView; taskExplorerSideBar: ITaskTreeView };
    fireTreeRefreshEvent(treeItem: TreeItem | null, taskItem: ITaskItem | null, logPad: string): void;
    getMessage(): string | undefined;
    getTaskItem(taskItem: ITaskItem | ITeTask | Uri): ITaskItem;
    refresh(invalidate: string | false | undefined, opt: Uri | false | undefined, logPad: string): Promise<void>;
    setMessage(message?: string): void;
}

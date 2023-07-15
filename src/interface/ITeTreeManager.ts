
import { ITaskItem } from "./ITaskItem";
import { ITaskFile } from "./ITaskFile";
import { ITaskFolder } from "./ITaskFolder";
import { ITaskTreeView } from "./ITeTaskTree";
import { Task, Uri, Event, TreeItem } from "vscode";
import { ITeTreeConfigWatcher } from "./ITeTreeConfigWatcher";
import { ITeTask, ITeTaskChangeEvent, TeTaskListType } from "./ITeTask";

export interface TaskMap<T = ITaskFolder | ITaskFile | ITaskItem> { [id: string]: T };

export interface ITeTreeSorter
{
	// sortFolders(folders: IDictionary<ITaskFolder>): ITaskFolder[];
	sortFolders(folders: ITaskFolder[]): void;
	sortTaskFolder(folder: ITaskFolder, listType: TeTaskListType): void;
	sortTasks(items: (ITaskFile | ITaskItem)[], listType: TeTaskListType): void;
}

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
    readonly sorter: ITeTreeSorter;
    readonly tasks: Task[];
    readonly taskMap: TaskMap<ITaskItem>;
    readonly taskFolders: ITaskFolder[];
    readonly views: { taskExplorer: ITaskTreeView; taskExplorerSideBar: ITaskTreeView };
    fireTreeRefreshEvent(treeItem: TreeItem | null, taskItem: ITaskItem | null, logPad: string): void;
    getMessage(): string | undefined;
    getTaskItem(taskItem: ITaskItem | ITeTask | Uri): ITaskItem;
    refresh(invalidate: string | false | undefined, opt: Uri | false | undefined, logPad: string): Promise<void>;
    setMessage(message?: string): void;
}

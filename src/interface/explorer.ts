
import { ExtensionContext, Task, TreeItem, Uri } from "vscode";
import { NoScripts } from "../lib/noScripts";
import TaskFile from "../tree/file";
import TaskFolder from "../tree/folder";
import TaskItem from "../tree/item";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TaskMap = { [id: string]: TaskItem };

export interface IExplorerApi
{
    buildTaskTree(tasksList: Task[], logPad: string, logLevel: number, force?: boolean): Promise<TaskFolder[] | NoScripts[]>;
    dispose(context: ExtensionContext): void;
    getChildren(element?: TreeItem, logPad?: string, logLevel?: number): Promise<TreeItem[]>;
    getParent(element: TreeItem): TreeItem | null;
    getTasks(): Task[] | null;
    getTaskItems(taskId: string | undefined, logPad?: string, executeOpenForTests?: boolean, logLevel?: number): Promise<TaskMap>;
    getTreeItem(element: TaskItem | TaskFile | TaskFolder): TreeItem;
    isBusy (): boolean;
    isVisible(): boolean;
    invalidateTasksCache(opt1?: string, opt2?: Uri | boolean, logPad?: string): Promise<void>;
    refresh(invalidate?: any, opt?: Uri | boolean, logPad?: string): Promise<void>;
    setEnabled(enable: boolean): void;
    showSpecialTasks(show: boolean, isFavorite?: boolean, forceChange?: boolean, taskItem?: TaskItem, logPad?: string): Promise<void>;
    waitForRefreshComplete(maxWait?: number): Promise<void>;
}

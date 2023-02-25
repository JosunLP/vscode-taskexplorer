
import { Task, tasks } from "vscode";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { Commands, registerCommand } from "../../lib/command/command";
import { ITeRunningTaskChangeEvent, ITeTasksChangeEvent, ITeTaskStatusChangeEvent } from "../../interface";
import {
	DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, MonitorAppState,
	DidChangeAllTasksType, ITask, DidChangeTaskStatusType, TaskListType
} from "../common/ipc";


export class MonitorPage extends TeWebviewPanel<MonitorAppState>
{
	static viewTitle = "Task Monitor";
	static viewId: WebviewIds = "taskMonitor"; // Must match view id in package.json


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"monitor.html",
			MonitorPage.viewTitle,
			"res/img/logo-bl.png",
			`taskexplorer.view.${MonitorPage.viewId}`,
			`${ContextKeys.WebviewPrefix}taskMonitor`,
			`${MonitorPage.viewId}View`,
			Commands.ShowTaskMonitorPage
		);

		this.disposables.push(
			registerCommand(Commands.SetPinned, this.setPinned, this),
			wrapper.treeManager.onReady(this.onTaskTreeManagerReady, this),
			wrapper.treeManager.onDidAllTasksChange(this.onAllTasksChanged, this),
			wrapper.treeManager.onDidLastTasksChange(this.onLastTasksChanged, this),
			wrapper.treeManager.onDidFavoriteTasksChange(this.onFavoriteTasksChanged, this),
			wrapper.treeManager.onDidFamousTasksChange(this.onFamousTasksChanged, this),
			wrapper.treeManager.onDidRunningTasksChange(this.onRunningTasksChanged, this),
			wrapper.treeManager.onDidTaskStatusChange(this.onTaskStatusChanged, this)
		);
	}


	private prepareTasksForIpc = (teTasks: Task[], listType: TaskListType, isRunning?: boolean): ITask[] =>
	{
		return teTasks.map<ITask>(t =>
		{
			const running = isRunning !== undefined ? isRunning :
				  tasks.taskExecutions.filter(e => e.task.name === t.name && e.task.source === t.source &&
											  e.task.scope === t.scope && e.task.definition.path === t.definition.path).length > 0;
			return {
				name: t.name,
				definition: t.definition,
				source: t.source,
				running,
				listType,
				treeId: t.definition.taskItemId,
				pinned: this.getPinned(t.definition.taskItemId, listType)
			};
		});
	};


	protected override getState = async(): Promise<MonitorAppState> =>
	{
		return {
			...(await super.getState()),
			last: this.prepareTasksForIpc(this.wrapper.treeManager.lastTasks, "last"),
			favorites: this.prepareTasksForIpc(this.wrapper.treeManager.favoriteTasks, "favorites"),
			running: this.prepareTasksForIpc(this.wrapper.treeManager.runningTasks, "running"),
			famous: this.prepareTasksForIpc(this.wrapper.treeManager.famousTasks, "famous"),
			tasks: this.prepareTasksForIpc(this.wrapper.treeManager.getTasks(), "all"),
			pinned: {
				last: this.wrapper.storage.get<ITask[]>("taskexplorer.pinned.last", []),
				famous: this.wrapper.storage.get<ITask[]>("taskexplorer.pinned.famous", []),
				favorites: this.wrapper.storage.get<ITask[]>("taskexplorer.pinned.favorites", []),
				running: this.wrapper.storage.get<ITask[]>("taskexplorer.pinned.running", [])
			}
		};
	};


	private handleTaskStateChangeEvent = (e: ITeTaskStatusChangeEvent) =>
	{
		this.notify(DidChangeTaskStatusType, { task: this.prepareTasksForIpc([ e.task ], "none", e.isRunning)[0] });
	};


	protected override includeBootstrap = (): Promise<MonitorAppState> => this.getState();
	protected override includeFontAwesome = () => ({ duotone: true, regular: true, solid: true, icons: [
		"gear", "gears", "star", "thumbtack", "chevron-right", "chevron-left", "chevron-double-left", "chevron-double-right"
	]});


	private onFamousTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeFamousTasksType, { tasks: this.prepareTasksForIpc(e.tasks, "famous") });
	private onFavoriteTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeFavoriteTasksType, { tasks: this.prepareTasksForIpc(e.tasks, "favorites") });
	private onLastTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeLastTasksType, { tasks: this.prepareTasksForIpc(e.tasks, "last") });
	private onRunningTasksChanged = async (e: ITeRunningTaskChangeEvent) => this.notify(DidChangeLastTasksType, { tasks: this.prepareTasksForIpc(e.tasks, "running") });
    private onAllTasksChanged = async (_e: ITeTasksChangeEvent) => this.notify(DidChangeAllTasksType, await this.getState());
	private onTaskStatusChanged = (e: ITeTaskStatusChangeEvent) => this.handleTaskStateChangeEvent(e);
	private onTaskTreeManagerReady = (e: ITeTasksChangeEvent) => this.notify(DidChangeAllTasksType, { tasks: this.prepareTasksForIpc(e.tasks, "all") });


	protected override onVisibilityChanged = (_visible: boolean) =>
	{
		// this.wrapper.log.methodStart("MonitorPage Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad(), false, [[ "visible", visible ]]);
		// this.wrapper.log.methodDone("MonitorPage Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad());
	};


	protected override onFocusChanged = (_focused: boolean): void =>
	{
		// this.wrapper.log.methodStart("MonitorPage Event: onFocusChanged", 2, this.wrapper.log.getLogPad(), false, [[ "focus", focused ]]);
		// this.wrapper.log.methodDone("MonitorPage Event: onFocusChanged", 2, this.wrapper.log.getLogPad());
	};


	private getPinned = (id: string, listType: TaskListType): boolean =>
	{
		const storageKey = `taskexplorer.pinned.${listType}`;
		const pinnedTaskList = this.wrapper.storage.get<ITask[]>(storageKey, []);
		return !!pinnedTaskList.find(t => t.treeId === id);
	};


	private setPinned = async (task: ITask): Promise<void> =>
	{
		const mMsg = "MonitorPage Event: setPinned",
			  logPad = this.wrapper.log.getLogPad(),
			  storageKey = `taskexplorer.pinned.${task.listType}`;
		this.wrapper.log.methodStart(mMsg, 2, logPad, false, [[ "id", task.treeId ], [ "pinned", task.pinned ]]);
		const pinnedTaskList = this.wrapper.storage.get<ITask[]>(storageKey, []);
		pinnedTaskList.push({  ...task });
		await this.wrapper.storage.update(storageKey, pinnedTaskList);
		this.wrapper.log.methodDone(mMsg, 2, logPad);
	};

}

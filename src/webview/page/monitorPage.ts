
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { toITask } from "../../lib/utils/taskTypeUtils";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { Commands, registerCommand } from "../../lib/command/command";
import { ITeRunningTaskChangeEvent, ITeTask, ITeTasksChangeEvent, ITeTaskStatusChangeEvent } from "../../interface";
import {
	DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, MonitorAppState,
	DidChangeAllTasksType, DidChangeTaskStatusType
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


	protected override getState = async(): Promise<MonitorAppState> =>
	{
		return {
			...(await super.getState()),
			last: toITask(this.wrapper.treeManager.lastTasks, "last"),
			favorites: toITask(this.wrapper.treeManager.favoriteTasks, "favorites"),
			running: toITask(this.wrapper.treeManager.runningTasks, "running"),
			famous: this.wrapper.treeManager.famousTasks,
			tasks: toITask(this.wrapper.treeManager.getTasks(), "all"),
			pinned: {
				last: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.last", []),
				famous: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.famous", []),
				favorites: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.favorites", []),
				running: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.running", [])
			}
		};
	};


	private handleTaskStateChangeEvent = (e: ITeTaskStatusChangeEvent) =>
	{
		this.notify(DidChangeTaskStatusType, { task: toITask([ e.task ], "none", e.isRunning)[0] });
	};


	protected override includeBootstrap = (): Promise<MonitorAppState> => this.getState();
	protected override includeFontAwesome = () => ({ duotone: true, regular: true, solid: true, icons: [
		"gear", "gears", "star", "thumbtack", "chevron-right", "chevron-left", "chevron-double-left", "chevron-double-right"
	]});


	private onFamousTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeFamousTasksType, { tasks: toITask(e.tasks, "famous") });
	private onFavoriteTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeFavoriteTasksType, { tasks: toITask(e.tasks, "favorites") });
	private onLastTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeLastTasksType, { tasks: toITask(e.tasks, "last") });
	private onRunningTasksChanged = async (e: ITeRunningTaskChangeEvent) => this.notify(DidChangeLastTasksType, { tasks: toITask(e.tasks, "running") });
    private onAllTasksChanged = async (_e: ITeTasksChangeEvent) => this.notify(DidChangeAllTasksType, await this.getState());
	private onTaskStatusChanged = (e: ITeTaskStatusChangeEvent) => this.handleTaskStateChangeEvent(e);
	private onTaskTreeManagerReady = (e: ITeTasksChangeEvent) => this.notify(DidChangeAllTasksType, { tasks: toITask(e.tasks, "all") });


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


	private setPinned = async (task: ITeTask): Promise<void> =>
	{
		const mMsg = "MonitorPage Event: setPinned",
			  logPad = this.wrapper.log.getLogPad(),
			  storageKey = `taskexplorer.pinned.${task.listType}`;
		this.wrapper.log.methodStart(mMsg, 2, logPad, false, [[ "id", task.treeId ], [ "pinned", task.pinned ]]);
		const pinnedTaskList = this.wrapper.storage.get<ITeTask[]>(storageKey, []);
		pinnedTaskList.push({  ...task });
		await this.wrapper.storage.update(storageKey, pinnedTaskList);
		this.wrapper.log.methodDone(mMsg, 2, logPad);
	};

}

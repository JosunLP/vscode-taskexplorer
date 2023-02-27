
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { toITask } from "../../lib/utils/taskUtils";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { Commands } from "../../lib/command/command";
import { ITeRunningTaskChangeEvent, ITeTask, ITeTaskChangeEvent, ITeTaskStatusChangeEvent } from "../../interface";
import {
	DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, MonitorAppState,
	DidChangeAllTasksType, DidChangeTaskStatusType, DidChangeRunningTasksType
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
			wrapper.treeManager.onReady(this.onTaskTreeManagerReady, this),
			wrapper.treeManager.onDidAllTasksChange(this.onAllTasksChanged, this),
			wrapper.treeManager.onDidLastTasksChange(this.onLastTasksChanged, this),
			wrapper.treeManager.onDidFavoriteTasksChange(this.onFavoriteTasksChanged, this),
			wrapper.usage.onDidFamousTasksChange(this.onFamousTasksChanged, this),
			wrapper.taskWatcher.onDidRunningTasksChange(this.onRunningTasksChanged, this),
			wrapper.taskWatcher.onDidTaskStatusChange(this.onTaskStatusChanged, this)
		);
	}


	protected override getState = async(): Promise<MonitorAppState> =>
	{
		return {
			...(await super.getState()),
			last: toITask(this.wrapper, this.wrapper.treeManager.lastTasks, "last"),
			favorites: toITask(this.wrapper, this.wrapper.treeManager.favoritesTasks, "favorites"),
			running: toITask(this.wrapper, this.wrapper.treeManager.runningTasks, "running"),
			famous: this.wrapper.treeManager.famousTasks,
			tasks: toITask(this.wrapper, this.wrapper.treeManager.getTasks(), "all"),
			pinned: {
				last: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.last", []),
				famous: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.famous", []),
				favorites: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.favorites", []),
				running: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.running", [])
			}
		};
	};


	protected override includeBootstrap = (): Promise<MonitorAppState> => this.getState();
	protected override includeFontAwesome = () => ({ duotone: true, regular: true, solid: true, icons: [
		"gear", "gears", "star", "trophy-star", "thumbtack", "chevron-right", "chevron-left", "chevron-double-left", "chevron-double-right"
	]});


	private handleTaskStateChangeEvent = (e: ITeTaskStatusChangeEvent) => this.notify(DidChangeTaskStatusType, { task: e.task });
	private onFamousTasksChanged = async (e: ITeTaskChangeEvent) => this.notify(DidChangeFamousTasksType, { tasks: e.tasks });
	private onFavoriteTasksChanged = async (e: ITeTaskChangeEvent) => this.notify(DidChangeFavoriteTasksType, { tasks: e.tasks });
	private onLastTasksChanged = async (e: ITeTaskChangeEvent) => this.notify(DidChangeLastTasksType, { tasks: e.tasks });
	private onRunningTasksChanged = async (e: ITeRunningTaskChangeEvent) => this.notify(DidChangeRunningTasksType, { tasks: e.tasks });
    private onAllTasksChanged = async (_e: ITeTaskChangeEvent) => this.notify(DidChangeAllTasksType, await this.getState());
	private onTaskStatusChanged = (e: ITeTaskStatusChangeEvent) => this.handleTaskStateChangeEvent(e);
	private onTaskTreeManagerReady = (e: ITeTaskChangeEvent) => this.notify(DidChangeAllTasksType, { tasks: e.tasks });


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

}

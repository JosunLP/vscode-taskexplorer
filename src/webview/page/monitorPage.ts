
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { ConfigurationChangeEvent } from "vscode";
import { toITask } from "../../lib/utils/taskUtils";
import { ITeRunningTaskChangeEvent, ITeTask, ITeTaskChangeEvent, ITeTaskStatusChangeEvent } from "../../interface";
import { MonitorAppState, IpcTasksChangedMsg, IpcTaskChangedMsg, IMonitorAppTimerMode, IpcConfigChangedMsg } from "../common/ipc";


export class MonitorPage extends TeWebviewPanel<MonitorAppState>
{

	constructor(wrapper: TeWrapper)
	{
		super(wrapper, "monitor.html", "Task Monitor", "taskMonitor", "res/img/logo-bl.png", wrapper.keys.Commands.ShowTaskMonitorPage);
	}


	private getSettingsState = () =>
	({
		timerMode: this.wrapper.config.get<IMonitorAppTimerMode>(this.wrapper.keys.Config.TaskMonitorTimerMode, "MM:SS"),
		trackStats: this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TaskMonitorTrackStats, true),
		trackUsage: this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TrackUsage, true),
	});


	protected override getState = (): MonitorAppState =>
	{
		return {
			...super.getState(),
			...this.getSettingsState(),
			famous: this.wrapper.treeManager.famousTasks,
			favorites: toITask(this.wrapper, this.wrapper.treeManager.favoritesTasks, "favorites"),
			last: toITask(this.wrapper, this.wrapper.treeManager.lastTasks, "last"),
			running: toITask(this.wrapper, this.wrapper.treeManager.runningTasks, "running"),
			tasks: toITask(this.wrapper, this.wrapper.treeManager.tasks, "all"),
			pinned: {
				last: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.last", []),
				famous: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.famous", []),
				favorites: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.favorites", []),
				running: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.running", [])
			}
		};
	};


	protected override includeBootstrap = (): MonitorAppState => this.getState();


	protected override includeFontAwesome = () => ({
		animations: true, brands: true, duotone: true, regular: true, solid: true,
		icons: [
			"gear", "gears", "trophy-star", "thumbtack", "chevron-right", "minus", "bars", "circle-xmark", "circle-info",
			"chevron-double-right", "clock", "arrow-up", "arrow-down", "turtle", "rabbit", "refresh", "memo-pad"
		]
	});


	private handleTaskStateChangeEvent = (e: ITeTaskStatusChangeEvent) => this.postMessage(IpcTaskChangedMsg, { task: e.task });


	private onFamousTasksChanged = (e: ITeTaskChangeEvent) => this.postMessage(IpcTasksChangedMsg, { tasks: e.tasks, list: "famous" });


	private onFavoriteTasksChanged = (e: ITeTaskChangeEvent) => this.postMessage(IpcTasksChangedMsg, { tasks: e.tasks, list: "favorites" });


	private onLastTasksChanged = (e: ITeTaskChangeEvent) => this.postMessage(IpcTasksChangedMsg, { tasks: e.tasks, list: "last" });


	private onRunningTasksChanged = (e: ITeRunningTaskChangeEvent) => this.postMessage(IpcTasksChangedMsg, { tasks: e.tasks, list: "running" });


    private onAllTasksChanged = (e: ITeTaskChangeEvent) => this.postMessage(IpcTasksChangedMsg, { tasks: e.tasks, list: "all" });


	private onTaskStatusChanged = (e: ITeTaskStatusChangeEvent) => this.handleTaskStateChangeEvent(e);


	protected override async onConfigChanged(e: ConfigurationChangeEvent)
	{
		if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.TaskMonitorTimerMode, this.wrapper.keys.Config.TrackUsage, this.wrapper.keys.Config.TaskMonitorTrackStats))
		{
			await this.postMessage(IpcConfigChangedMsg, this.getSettingsState());
		}
		super.onConfigChanged(e);
	}


	protected override onInitializing()
	{
		return  [
			this.wrapper.treeManager.onDidAllTasksChange(this.onAllTasksChanged, this),
			this.wrapper.treeManager.onDidLastTasksChange(this.onLastTasksChanged, this),
			this.wrapper.treeManager.onDidFavoriteTasksChange(this.onFavoriteTasksChanged, this),
			this.wrapper.usage.onDidFamousTasksChange(this.onFamousTasksChanged, this),
			this.wrapper.taskWatcher.onDidRunningTasksChange(this.onRunningTasksChanged, this),
			this.wrapper.taskWatcher.onDidTaskStatusChange(this.onTaskStatusChanged, this)
		];
	}


	protected override onVisibilityChanged = (visible: boolean) =>
		this.wrapper.log.methodEvent("task monitor", "visibility changed", 2, [[ "visible", visible ]]);


	protected override onFocusChanged = (focused: boolean): void =>
		this.wrapper.log.methodEvent("task monitor", "focus changed", 2, [[ "focused", focused ]]);

}

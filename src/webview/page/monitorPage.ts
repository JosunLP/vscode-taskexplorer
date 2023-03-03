
import { TeWrapper } from "../../lib/wrapper";
import { ConfigKeys } from "../../lib/constants";
import { TeWebviewPanel } from "../webviewPanel";
import { ConfigurationChangeEvent } from "vscode";
import { toITask } from "../../lib/utils/taskUtils";
import { Commands } from "../../lib/command/command";
import { ContextKeys, WebviewIds } from "../../lib/context";
import {
	ITeRunningTaskChangeEvent, ITeTask, ITeTaskChangeEvent, ITeTaskStatusChangeEvent
} from "../../interface";
import {
	MonitorAppState, IpcTasksChangedMsg, IpcTaskChangedMsg, IMonitorAppTimerMode, IpcConfigChangedMsg, IpcStateChangedMsg
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
			wrapper.taskWatcher.onDidTaskStatusChange(this.onTaskStatusChanged, this),
			wrapper.config.onDidChange(e => { this.onConfigChanged(e); }, this)
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
			timerMode: this.wrapper.config.get<IMonitorAppTimerMode>(ConfigKeys.TaskMonitor_TimerMode),
			pinned: {
				last: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.last", []),
				famous: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.famous", []),
				favorites: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.favorites", []),
				running: this.wrapper.storage.get<ITeTask[]>("taskexplorer.pinned.running", [])
			}
		};
	};


	protected override includeBootstrap = (): Promise<MonitorAppState> => this.getState();


	protected override includeFontAwesome = () => ({
		animations: true, brands: true, duotone: true, regular: true, solid: true,
		icons: [
			"gear", "gears", "trophy-star", "thumbtack", "chevron-right", "minus", "bars", "circle-xmark",
			"chevron-double-right", "clock", "arrow-up", "arrow-down", "turtle", "rabbit", "refresh", "memo-pad"
		]
	});


	private handleTaskStateChangeEvent = (e: ITeTaskStatusChangeEvent) => this.notify(IpcTaskChangedMsg, { task: e.task });


	private onFamousTasksChanged = async (e: ITeTaskChangeEvent) => this.notify(IpcTasksChangedMsg, { tasks: e.tasks, list: "famous" });


	private onFavoriteTasksChanged = async (e: ITeTaskChangeEvent) => this.notify(IpcTasksChangedMsg, { tasks: e.tasks, list: "favorites" });


	private onLastTasksChanged = async (e: ITeTaskChangeEvent) => this.notify(IpcTasksChangedMsg, { tasks: e.tasks, list: "last" });


	private onRunningTasksChanged = async (e: ITeRunningTaskChangeEvent) => this.notify(IpcTasksChangedMsg, { tasks: e.tasks, list: "running" });


    private onAllTasksChanged = async (_e: ITeTaskChangeEvent) => this.notify(IpcStateChangedMsg, await this.getState());


	private onTaskStatusChanged = (e: ITeTaskStatusChangeEvent) => this.handleTaskStateChangeEvent(e);


	private onTaskTreeManagerReady = (e: ITeTaskChangeEvent) => this.notify(IpcTasksChangedMsg, { tasks: e.tasks, list: "all" });


	private async onConfigChanged(e: ConfigurationChangeEvent)
	{
		if (e.affectsConfiguration(`taskexplorer.${ConfigKeys.TaskMonitor_TimerMode}`))
		{
			return this.notify(IpcConfigChangedMsg, {
				timerMode: this.wrapper.config.get<IMonitorAppTimerMode>(ConfigKeys.TaskMonitor_TimerMode)
			});
		}
		return false;
	}


	protected override onVisibilityChanged = (visible: boolean) =>
		this.wrapper.log.methodOnce("monitor view", "visibility changed", 2, this.wrapper.log.getLogPad(), [[ "visible", visible ]]);


	protected override onFocusChanged = (focused: boolean): void =>
		this.wrapper.log.methodOnce("monitor view", "focus changed", 2, this.wrapper.log.getLogPad(), [[ "focused", focused ]]);

}

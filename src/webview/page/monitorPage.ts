
import { Task } from "vscode";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { Commands } from "../../lib/command/command";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { ITeTasksChangeEvent, ITeTaskStatusChangeEvent } from "../../interface";
import {
	DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, MonitorAppState,
	DidChangeAllTasksType, ITask
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
			Commands.ShowMonitorPage
		);

		this.disposables.push(
			wrapper.treeManager.onReady(this.onTaskTreeManagerReady, this),
			wrapper.treeManager.onDidTasksChange(this.onTasksChanged, this),
			wrapper.treeManager.onDidLastTasksChange(this.onLastTasksChanged, this),
			wrapper.treeManager.onDidFavoriteTasksChange(this.onFavoriteTasksChanged, this),
			wrapper.treeManager.onDidFamousTasksChange(this.onFamousTasksChanged, this),
			wrapper.treeManager.onDidRunningTasksChange(this.onRunningTasksChanged, this),
			wrapper.treeManager.onDidTaskStatusChange(this.onTaskStatusChanged, this)
		);
	}


	private prepareTasksForTransport = (tasks: Task[]): ITask[] =>
	{
		return tasks.map<ITask>(t => ({
			name: t.name,
			definition: t.definition,
			source: t.source,
			treeId: "",
			running: false // TODO - Set `running` flag
		}));
	};


	protected override getState = async(): Promise<MonitorAppState> =>
	{
		return {
			...(await super.getState()),
			last: this.prepareTasksForTransport(this.wrapper.treeManager.lastTasks),
			favorites: this.prepareTasksForTransport(this.wrapper.treeManager.favoriteTasks),
			running: this.prepareTasksForTransport(this.wrapper.treeManager.runningTasks),
			famous: this.prepareTasksForTransport(this.wrapper.treeManager.famousTasks),
			tasks: this.prepareTasksForTransport(this.wrapper.treeManager.getTasks())
		};
	};


	protected override includeBootstrap = (): Promise<MonitorAppState> => this.getState();
	protected override includeFontAwesome = () => ({ duotone: true, regular: true, icons: [ "gears", "gear", "gears", "star" ] });


	private onFamousTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeFamousTasksType, { tasks: this.prepareTasksForTransport(e.tasks) });
	private onFavoriteTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeFavoriteTasksType, { tasks: this.prepareTasksForTransport(e.tasks) });
	private onLastTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeLastTasksType, { tasks: this.prepareTasksForTransport(e.tasks) });
	private onRunningTasksChanged = async (e: ITeTasksChangeEvent) => this.notify(DidChangeLastTasksType, { tasks: this.prepareTasksForTransport(e.tasks) });
    private onTasksChanged = async (_e: ITeTasksChangeEvent) => this.notify(DidChangeAllTasksType, await this.getState());
	private onTaskStatusChanged = (_e: ITeTaskStatusChangeEvent) => {};
	private onTaskTreeManagerReady = (_e: ITeTasksChangeEvent) => {};


	protected override onVisibilityChanged = (visible: boolean) =>
	{
		// this.wrapper.log.methodStart("MonitorPage Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad(), false, [[ "visible", visible ]]);
		// this.wrapper.log.methodDone("MonitorPage Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad());
	};


	protected override onFocusChanged = (focused: boolean): void =>
	{
		// this.wrapper.log.methodStart("MonitorPage Event: onFocusChanged", 2, this.wrapper.log.getLogPad(), false, [[ "focus", focused ]]);
		// this.wrapper.log.methodDone("MonitorPage Event: onFocusChanged", 2, this.wrapper.log.getLogPad());
	};

}

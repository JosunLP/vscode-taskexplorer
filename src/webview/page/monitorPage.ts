
import { AppMonitorState, AppState, State } from "../common/state";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { Commands } from "../../lib/command/command";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { ITeTasksChangeEvent, ITeTaskStatusChangeEvent } from "../../interface";
import { DidChangeStateType } from "../common/ipc";


export class MonitorPage extends TeWebviewPanel<State>
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
			wrapper.treeManager.onDidTasksChange(e => { this.onTasksChanged(e); }, this),
			wrapper.treeManager.onDidTaskStatusChange(e => this.onTaskStatusChanged(e), this)
		);
	}


	protected override async getState(): Promise<AppMonitorState>
	{
		return {
			...(await super.getState()),
			seconds: 0,
			taskType: "grunt",
			tasks: []
		};
	}


	protected override includeBootstrap = (): Promise<State> => this.getState();


	protected override includeFontAwesome = () => ({ duotone: true, regular: true, icons: [ "gears", "gear", "gears", "star" ] });


    private async onTasksChanged(_e: ITeTasksChangeEvent)
	{
		if (this.isFirstLoadComplete) {
			await this.refresh();
		}
	}


	private async onTaskStatusChanged(e: ITeTaskStatusChangeEvent)
	{
		await this.refresh();
		const state = await this.getState();
		return this.notify(DidChangeStateType, Object.assign(state, {
			param1: e.task,
			param2: e.isRunning,
			param3: e.taskItemId
		}));
	}


	protected override onVisibilityChanged(visible: boolean)
	{
		// this.wrapper.log.methodStart("MonitorPage Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad(), false, [[ "visible", visible ]]);
		// this.wrapper.log.methodDone("MonitorPage Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad());
	}


	protected override onFocusChanged(focused: boolean): void
	{
		// this.wrapper.log.methodStart("MonitorPage Event: onFocusChanged", 2, this.wrapper.log.getLogPad(), false, [[ "focus", focused ]]);
		// this.wrapper.log.methodDone("MonitorPage Event: onFocusChanged", 2, this.wrapper.log.getLogPad());
	}

}

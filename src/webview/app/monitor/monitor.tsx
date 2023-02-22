
import "../common/css/vscode.css";
import "../common/css/react.css";
import "../common/css/tabs.css";
import "../common/css/page.css";
import "./monitor.css";
import "./monitor.scss";

import React, { useRef, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

import { TeWebviewApp } from "../webviewApp";
import { TeTaskControl } from "./cmp/control";
// eslint-disable-next-line import/extensions
import { createRoot } from "react-dom/client";
import { DidChangeLastTasksType, DidChangeRunningTasksType, DidChangeStateParams, DidChangeStateType, DidChangeTaskStatusType, DidChangeTaskType, InternalNotificationType, IpcMessage, IpcNotificationType, ITask, onIpc, StateChangedCallback } from "../../common/ipc";


interface State
{
	tasks: ITask[];
	favorites: ITask[];
	lastTasks: ITask[];
	runningTasks: ITask[];
    webroot: string;
}

interface ControlState
{
	last: State;
	running: State;
	favorites: State;
	famous: State;
};

class TaskMonitorWebviewApp extends TeWebviewApp<State>
{
    private callback?: StateChangedCallback;
    private controlState: ControlState;

    constructor()
    {
		super("TaskMonitorWebviewApp");
		//
		// this.state is populated in the the TeWebviewApp (super) constructor,
		// read from window.bootstrap
		//
		this.controlState = {
			last: Object.assign({}, this.state, { seconds: 0, tasks: this.state.lastTasks }),
			running: Object.assign({}, this.state, { seconds: 10, tasks: this.state.runningTasks }),
			favorites: Object.assign({}, this.state, { seconds: 20, tasks: this.state.favorites }),
			famous: Object.assign({}, this.state, { seconds: 30, tasks: this.state.favorites }),
		};
	}


	protected override onInitialize = () =>
	{
		this.log(`${this.appName}.onInitialize`);

		//
		// TODO - Test what vscode.getState/setState is all about...
		//
		const state = this.getState();
		if (state) {
			console.log("!!!");
			console.log("!!! VSCODE GETSTATE() ");
			console.log(state);
			console.log("!!!");
		}
		// const [ tasks, setTasks ] = useState(this.state.param1 ?? []);
	};


    protected override onBind = () =>
    {
		const disposables = super.onBind?.() ?? [];
		this.log(`${this.appName}.onBind`);
		// const [ tabIndex, setTabIndex ] = useState(0);

		// const [ tabIndex, setTabIndex ] = useState(0);
		//
		// Without the 'forceRenderTabPanel' flag, the TabPanel component is
		// destroyed / removed from the DOM as soon as it loses focus i.e. every
		// time a tab is selected.  This was a better option than tracking each
		// tab's state from this component.
		//
        const root = createRoot(document.getElementById("root") as HTMLElement);
        root.render(
			<div className="te-tabs-container">
				<Tabs className="te-tabs" /* selectedIndex={tabIndex} */ onSelect={this.onTabSelected} forceRenderTabPanel={true} defaultFocus={true}>
					<TabList>
						<Tab>Recent</Tab>
						<Tab>Running</Tab>
						<Tab>Favorites</Tab>
						<Tab>Famous</Tab>
					</TabList>
					<TabPanel>
						<TeTaskControl
							id="te-id-view-monitor-control-recent"
							key="tsx-id-view-monitor-control-recent"
							state={this.controlState.last}
							subscribe={(callback: StateChangedCallback) => this.registerEventCallback(callback)}
						/>
					</TabPanel>
					<TabPanel>
						<TeTaskControl
							id="te-id-view-monitor-control-recent"
							key="tsx-id-view-monitor-control-recent"
							state={this.controlState.running}
							subscribe={(callback: StateChangedCallback) => this.registerEventCallback(callback)}
						/>
					</TabPanel>
					<TabPanel>
						<TeTaskControl
							id="te-id-view-monitor-control-favorites"
							key="tsx-id-view-monitor-control-favorites"
							state={this.controlState.favorites}
							subscribe={(callback: StateChangedCallback) => this.registerEventCallback(callback)}
						/>
					</TabPanel>
					<TabPanel>
						<TeTaskControl
							id="te-id-view-monitor-control-famous"
							key="tsx-id-view-monitor-control-famous"
							state={this.controlState.famous}
							subscribe={(callback: StateChangedCallback) => this.registerEventCallback(callback)}
						/>
					</TabPanel>
				</Tabs>
			</div>
        );

        disposables.push({
            dispose: () => root.unmount()
        });

		return disposables;
	};


	private onTabSelected = (index: number, lastIndex: number) =>
	{
		this.log(`${this.appName}.onTabSelected: index=${index}: lastIdex=${lastIndex}`);
	};


	protected override onMessageReceived = (e: MessageEvent) =>
    {
		const msg = e.data as IpcMessage;
		this.log(`${this.appName}.onMessageReceived(${msg.id}): name=${msg.method}`);

		switch (msg.method) {
			case DidChangeTaskType.method:
				onIpc(DidChangeTaskType, msg, params => {
					this.state.tasks  = { ...params.tasks };
					this.setState(this.state, DidChangeTaskType);
				});
				break;
			case DidChangeLastTasksType.method:
				onIpc(DidChangeTaskType, msg, params => {
					this.state.lastTasks = { ...params.tasks };
					this.setState(this.state);
				});
				break;
			case DidChangeRunningTasksType.method:
				onIpc(DidChangeTaskType, msg, params => {
					this.state.runningTasks = { ...params.tasks };
					this.setState(this.state);
				});
				break;
			case DidChangeTaskStatusType.method:
				onIpc(DidChangeTaskStatusType, msg, params => {
					// this.state.tasks  = params.task;
					this.setState(this.state);
				});
				break;
			case DidChangeStateType.method:
				onIpc(DidChangeStateType, msg, params => {
					this.processBaseStateChange(params);
				});
				break;
			default:
				super.onMessageReceived?.(e);
		}
	};


	private processBaseStateChange = (params: DidChangeStateParams) =>
    {
		this.log(`${this.appName}.processBaseStateChange`);
		this.state = Object.assign({ ...this.state }, { ...params  });
		// this.state = Object.assign({ ...this.state, }, { state });
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
		this.callback?.(this.state, DidChangeStateType);
	};


	protected override setState = (state: State, type?:  IpcNotificationType<any>) => // | InternalNotificationType)
    {
		this.log(`${this.appName}.setState`);
		this.state = state;
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
		this.callback?.(this.state, type);
	};


	private registerEventCallback = (callback: StateChangedCallback): (() => void) =>
    {
		this.callback = callback;
		return () => {
			this.callback = undefined;
		};
	};

}

new TaskMonitorWebviewApp();

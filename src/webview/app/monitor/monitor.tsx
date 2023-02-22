
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
import { DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, DidChangeRunningTasksType, DidChangeStateParams, DidChangeStateType, DidChangeTaskStatusType, DidChangeTaskType, InternalNotificationType, IpcMessage, IpcNotificationType, ITask, onIpc, StateChangedCallback } from "../../common/ipc";
import AppWrapper from "./cmp/app";


interface State
{
	tasks: ITask[];
	famous: ITask[];
	favorites: ITask[];
	lastTasks: ITask[];
	runningTasks: ITask[];
    webroot: string;
}

class TaskMonitorWebviewApp extends TeWebviewApp<State>
{
    private callback?: StateChangedCallback;
    // private controlState: ControlState;

    constructor()
    {
		super("TaskMonitorWebviewApp");
		//
		// this.state is populated in the the TeWebviewApp (super) constructor,
		// read from window.bootstrap
		//
		// this.controlState = {
		// 	last: Object.assign({}, this.state, { seconds: 0, tasks: this.state.lastTasks }),
		// 	running: Object.assign({}, this.state, { seconds: 10, tasks: this.state.runningTasks }),
		// 	favorites: Object.assign({}, this.state, { seconds: 20, tasks: this.state.favorites }),
		// 	famous: Object.assign({}, this.state, { seconds: 30, tasks: this.state.favorites }),
		// };
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

        const root = createRoot(document.getElementById("root") as HTMLElement);
        root.render(
			<AppWrapper
				state={this.state}
				subscribe={(callback: StateChangedCallback) => this.registerEventCallback(callback)}
			 />
        );

        disposables.push({
            dispose: () => root.unmount()
        });

		return disposables;
	};


	protected override onMessageReceived = (e: MessageEvent) =>
    {
		const msg = e.data as IpcMessage;
		this.log(`${this.appName}.onMessageReceived(${msg.id}): name=${msg.method}`);

		switch (msg.method)
		{
			case DidChangeTaskType.method:
				onIpc(DidChangeTaskType, msg, params => {
					Object.assign(this.state, { ...params });
					this.setState(this.state, DidChangeTaskType);
				});
				break;
			case DidChangeLastTasksType.method:
				onIpc(DidChangeLastTasksType, msg, params => {
					this.state.lastTasks = { ...params.tasks };
					this.setState(this.state, DidChangeLastTasksType);
				});
				break;
			case DidChangeRunningTasksType.method:
				onIpc(DidChangeRunningTasksType, msg, params => {
					this.state.runningTasks = { ...params.tasks };
					this.setState(this.state, DidChangeRunningTasksType);
				});
				break;
			case DidChangeFamousTasksType.method:
				onIpc(DidChangeFamousTasksType, msg, params => {
					this.state.favorites = { ...params.tasks };
					this.setState(this.state, DidChangeFamousTasksType);
				});
				break;
			case DidChangeFavoriteTasksType.method:
				onIpc(DidChangeFavoriteTasksType, msg, params => {
					this.state.favorites = { ...params.tasks };
					this.setState(this.state, DidChangeFavoriteTasksType);
				});
				break;
			case DidChangeTaskStatusType.method:
				onIpc(DidChangeTaskStatusType, msg, params => {
					// this.state.tasks  = params.task;
					// this.setState(this.state, DidChangeTaskStatusType);
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
		Object.assign(this.state, { ...params  });
		//  this.setState(params);
		// this.state = Object.assign({ ...this.state, }, { state });
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
		this.callback?.(this.state, DidChangeStateType);
	};


	protected override setState = (state: State, type?:  IpcNotificationType<any>) => // | InternalNotificationType)
    {
		this.log(`${this.appName}.setState`);
		Object.assign(this.state, { ...state });
		// Object.assign(this.controlState.last, { tasks: this.state.lastTasks });
		// Object.assign(this.controlState.running, { tasks: this.state.runningTasks });
		// Object.assign(this.controlState.favorites, { tasks: this.state.favorites });
		// Object.assign(this.controlState.famous, { tasks: this.state.favorites });
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

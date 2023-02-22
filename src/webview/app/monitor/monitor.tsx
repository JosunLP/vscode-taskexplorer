
import "../common/css/vscode.css";
import "../common/css/react.css";
import "../common/css/tabs.css";
import "../common/css/page.css";
import "./monitor.css";
import "./monitor.scss";

import React from "react";
import { AppWrapper } from "./cmp/app";
import { TeWebviewApp } from "../webviewApp";
// eslint-disable-next-line import/extensions
import { createRoot } from "react-dom/client";
import {
	DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, DidChangeRunningTasksType,
	DidChangeStateParams, DidChangeStateType, DidChangeTaskStatusType, DidChangeTaskType,
	IpcMessage, IpcNotificationType, ITask, onIpc, StateChangedCallback
} from "../../common/ipc";

interface State
{
	tasks: ITask[];
	famous: ITask[];
	favorites: ITask[];
	last: ITask[];
	running: ITask[];
    webroot: string;
}

class TaskMonitorWebviewApp extends TeWebviewApp<State>
{
    private callback?: StateChangedCallback;
    // private controlState: ControlState;

    constructor()
    {   //
		// this.state is populated in the the TeWebviewApp (super) constructor,
		// read from window.bootstrap
		//
		super("TaskMonitorWebviewApp");
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
					this.state.last = [ ...params.tasks ];
					this.setState(this.state, DidChangeLastTasksType);
				});
				break;
			case DidChangeRunningTasksType.method:
				onIpc(DidChangeRunningTasksType, msg, params => {
					this.state.running = [ ...params.tasks ];
					this.setState(this.state, DidChangeRunningTasksType);
				});
				break;
			case DidChangeFamousTasksType.method:
				onIpc(DidChangeFamousTasksType, msg, params => {
					this.state.favorites = [ ...params.tasks ];
					this.setState(this.state, DidChangeFamousTasksType);
				});
				break;
			case DidChangeFavoriteTasksType.method:
				onIpc(DidChangeFavoriteTasksType, msg, params => {
					this.state.favorites = [ ...params.tasks ];
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
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
		this.callback?.(this.state, DidChangeStateType);
	};


	protected override setState = (state: State, type?:  IpcNotificationType<any>) => // | InternalNotificationType)
    {
		this.log(`${this.appName}.setState`);
		Object.assign(this.state, { ...state });
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

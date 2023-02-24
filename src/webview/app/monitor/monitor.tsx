
import "../common/css/vscode.css";
import "../common/css/react.css";
import "../common/css/tabs.css";
import "../common/css/page.css";
import "./monitor.css";
import "./monitor.scss";

import React from "react";
import { App } from "./cmp/app";
import { TeWebviewApp } from "../webviewApp";
// eslint-disable-next-line import/extensions
import { createRoot } from "react-dom/client";
import {
	DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, DidChangeRunningTasksType,
	DidChangeStateParams, DidChangeStateType, DidChangeTaskStatusType, DidChangeAllTasksType, IpcMessage,
	IpcNotificationType, onIpc, MonitorAppState, ITask, DidChangeTaskStatusParams
} from "../../common/ipc";


class TaskMonitorWebviewApp extends TeWebviewApp<MonitorAppState>
{
	private appRef: React.RefObject<App>;

    constructor()
    {   //
		// `this.state` is populated in the the TeWebviewApp (super) constructor,
		// read from window.bootstrap
		//
		super("TaskMonitorWebviewApp");
		this.appRef = React.createRef<App>();
	}


	get app() {
		return this.appRef.current as App;
	}


	private handleTaskStateChangeEvent = (params: DidChangeTaskStatusParams) =>
	{
		let task = this.state.last.find(t => params.task.name === t.name);
		if (task) {
			this.setState(this.state, DidChangeLastTasksType);
		}
		task = this.state.running.find(t => params.task.name === t.name);
		if (task) {
			this.setState(this.state, DidChangeRunningTasksType);
		}
		task = this.state.favorites.find(t => params.task.name === t.name);
		if (task) {
			this.setState(this.state, DidChangeFavoriteTasksType);
		}
		task = this.state.famous.find(t => params.task.name === t.name);
		if (task) {
			this.setState(this.state, DidChangeFamousTasksType);
		}
	};


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
			<App
				ref={this.appRef}
				state={this.state}
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
			case DidChangeAllTasksType.method:
				onIpc(DidChangeAllTasksType, msg, params => {
					Object.assign(this.state, { ...params });
					this.setState(this.state, DidChangeAllTasksType);
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
					this.handleTaskStateChangeEvent(params);
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
		this.setState(this.state, DidChangeStateType);
	};


	protected override setState = (state: MonitorAppState, type?:  IpcNotificationType<any>) =>
    {
		this.log(`${this.appName}.setState`, state);
		Object.assign(this.state, { ...state });
		switch (type) {
            case DidChangeStateType:
                break;
            case DidChangeLastTasksType:
                this.app.recentTab.setState({ tasks: state.last });
                break;
            case DidChangeFavoriteTasksType:
                this.app.favoritesTab.setState({ tasks: state.favorites });
                break;
            case DidChangeFamousTasksType:
                this.app.famousTab.setState({ tasks: state.famous });
                break;
            case DidChangeRunningTasksType:
                this.app.runningTab.setState({ tasks: state.running });
                break;
        }
	};

}

new TaskMonitorWebviewApp();

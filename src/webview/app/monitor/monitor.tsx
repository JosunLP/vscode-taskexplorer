
import "../common/css/vscode.css";
import "../common/css/react.css";
import "../common/css/tabs.css";
import "../common/css/page.css";
import "./monitor.css";
import "./monitor.scss";

import React from "react";
import { App } from "./cmp/app";
import { Disposable } from "../common/dom";
import { TeWebviewApp } from "../webviewApp";
// eslint-disable-next-line import/extensions
import { createRoot } from "react-dom/client";
import {
	DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType, DidChangeRunningTasksType,
	DidChangeStateParams, DidChangeStateType, DidChangeTaskStatusType, DidChangeAllTasksType, IpcMessage,
	onIpc, MonitorAppState, ITask, DidChangeTaskStatusParams, IpcCommandType, ExecuteCommandType
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


	get app(): App {
		return this.appRef.current as App;
	}


    private executeCommand = (command: string, task: ITask): void =>
    {
		this.sendCommand(ExecuteCommandType, { command: `taskexplorer.${command}`, args: [ task ] });
    };


	private handleTaskStateChangeEvent = (params: DidChangeTaskStatusParams): void =>
	{
		// let task = this.state.last.find(t => params.task.name === t.name);
		// if (task) {
		// 	this.app.recentTab.setState({ tasks: this.state.last });
		// }
		// task = this.state.running.find(t => params.task.name === t.name);
		// if (task) {
		// 	this.app.runningTab.setState({ tasks: this.state.running });
		// }
		// task = this.state.favorites.find(t => params.task.name === t.name);
		// if (task) {
		// 	this.app.favoritesTab.setState({ tasks: this.state.favorites });
		// }
		// task = this.state.famous.find(t => params.task.name === t.name);
		// if (task) {
		// 	this.app.famousTab.setState({ tasks: this.state.famous });
		// }
	};


	protected override onInitialize = (): void =>
	{
		this.log("onInitialize");
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


    protected override onBind = (): Disposable[] =>
    {
		const disposables = super.onBind?.() ?? [];
		this.log("onBind");
        const root = createRoot(document.getElementById("root") as HTMLElement);
        root.render(
			<App
				ref={this.appRef}
				state={this.state}
				log={this.log.bind(this)}
				executeCommand={this.executeCommand.bind(this)}
			 />
        );
        disposables.push({
            dispose: () => root.unmount()
        });
		return disposables;
	};


	protected override onMessageReceived = (e: MessageEvent): void =>
    {
		const msg = e.data as IpcMessage;
		switch (msg.method)
		{
			case DidChangeAllTasksType.method:
				onIpc(DidChangeAllTasksType, msg, params => {
					Object.assign(this.state, { ...params });
					this.log(`onMessageReceived(${msg.id}): name=${msg.method}`);
					this.setState(this.state);
				});
				break;
			case DidChangeLastTasksType.method:
				onIpc(DidChangeLastTasksType, msg, params => {
					this.state.last = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.last);
					this.app.recentTab.setState({ tasks: this.state.last });
				});
				break;
			case DidChangeRunningTasksType.method:
				onIpc(DidChangeRunningTasksType, msg, params => {
					this.state.running = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.running);
					this.app.runningTab.setState({ tasks: this.state.running });
				});
				break;
			case DidChangeFamousTasksType.method:
				onIpc(DidChangeFamousTasksType, msg, params => {
					this.state.famous = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.famous);
					this.app.famousTab.setState({ tasks: this.state.famous });
				});
				break;
			case DidChangeFavoriteTasksType.method:
				onIpc(DidChangeFavoriteTasksType, msg, params => {
					this.state.favorites = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.favorites);
					this.app.favoritesTab.setState({ tasks: this.state.favorites });
				});
				break;
			case DidChangeTaskStatusType.method:
				onIpc(DidChangeTaskStatusType, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, params);
					this.handleTaskStateChangeEvent(params);
				});
				break;
			case DidChangeStateType.method:
				onIpc(DidChangeStateType, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, params);
					this.processBaseStateChange(params);
				});
				break;
			default:
				super.onMessageReceived?.(e);
		}
	};


	private processBaseStateChange = (params: DidChangeStateParams): void =>
    {
		this.log("processBaseStateChange");
		Object.assign(this.state, { ...params  });
		this.setState(this.state);
	};


	protected override setState = (state: MonitorAppState): void =>
    {
		this.log("setState", state);
		Object.assign(this.state, { ...state  });
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
	};

}

new TaskMonitorWebviewApp();

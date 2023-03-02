
import "../common/css/vscode.css";
import "../common/css/react.css";
import "../common/css/tabs.css";
import "../common/css/page.css";
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
	onIpc, MonitorAppState, IIpcTask, DidChangeTaskStatusParams, IpcCommandType, ExecuteCommandType, DidChangeConfigurationType, UpdateConfigCommandType
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


    private executeCommand = (command: string, task: IIpcTask): void =>
		this.sendCommand(ExecuteCommandType, { command: `taskexplorer.${command}`, args: [ task ] });


    private executeUpdateConfig = (key: string, value?: any): void =>
		this.sendCommand(UpdateConfigCommandType, { key: `taskMonitor.${key}`, value });


	private handleTaskStateChangeEvent = (params: DidChangeTaskStatusParams): void =>
	{
		const tIdx = this.state.tasks.findIndex(t => params.task.treeId === t.treeId);
		if (tIdx !== -1) {
			this.state.tasks.splice(tIdx, 1, params.task);
			this.setState(this.state);
		}
		this.app.setTask(params.task);
	};


	protected override onFocuschanged = (focused: boolean): void =>
	{
		this.log(`onFocuschanged: focused=${focused}`);
		if (!focused) {
		// 	queueMicrotask(() => {
		// 		if (this.app.state.menuVisible) {
		// 			this.app.toggleMenu();
		// 		}
		// 	});
		}
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
		this.log("onBind");
		const disposables = [];
        const root = createRoot(document.getElementById("root") as HTMLElement);
        root.render(
			<App
				ref={this.appRef}
				state={this.state}
				log={this.log.bind(this)}
				executeCommand={this.executeCommand.bind(this)}
				updateConfig={this.executeUpdateConfig.bind(this)}
			/>
        );
        disposables.push({ dispose: () => root.unmount() });
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
					this.app.setTasks("all", this.state.tasks);
					this.setState(this.state);
				});
				break;
			case DidChangeLastTasksType.method:
				onIpc(DidChangeLastTasksType, msg, params => {
					this.state.last = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.last);
					this.app.setTasks("last", this.state.last);
				});
				break;
			case DidChangeRunningTasksType.method:
				onIpc(DidChangeRunningTasksType, msg, params => {
					this.state.running = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.running);
					this.app.setTasks("running", this.state.running);
				});
				break;
			case DidChangeFamousTasksType.method:
				onIpc(DidChangeFamousTasksType, msg, params => {
					this.state.famous = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.famous);
					this.app.setTasks("famous", this.state.famous);
				});
				break;
			case DidChangeFavoriteTasksType.method:
				onIpc(DidChangeFavoriteTasksType, msg, params => {
					this.state.favorites = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.favorites);
					this.app.setTasks("favorites", this.state.favorites);
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
			case DidChangeConfigurationType.method:
				onIpc(DidChangeConfigurationType, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, params);
					this.app.setTimerMode(params.timerMode);
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
		// this.setState(this.state);
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
	};


	protected override setState = (state: MonitorAppState): void =>
    {
		this.log("setState", state);
		Object.assign(this.state, { ...state  });
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
	};

}

new TaskMonitorWebviewApp();

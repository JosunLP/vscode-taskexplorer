
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
	IpcDidChangeFamousTasks, IpcDidChangeFavoriteTasks, IpcDidChangeLastTasks, IpcDidChangeRunningTasks,
	DidChangeStateParams, IpcDidChangeState, IpcDidChangeTaskStatus, IpcDidChangeAllTasks, IIpcMessage,
	onIpc, MonitorAppState, DidChangeTaskStatusParams, IpcExecCommand, IpcDidChangeConfig, IpcUpdateConfigCommand
} from "../../common/ipc";


/**
 * @class TaskMonitorWebviewApp
 * @since 3.0.0
 *
 * `this.state` is populated in the the base TeWebviewApp super constructor, passed from
 * the extension using `window.bootstrap`.
 */
class TaskMonitorWebviewApp extends TeWebviewApp<MonitorAppState>
{
	private appRef: React.RefObject<App>;


    constructor()
    {
		super("TaskMonitorWebviewApp");
		this.appRef = React.createRef<App>();
	}


	get app(): App {
		return this.appRef.current as App;
	}


    private executeCommand = (command: string, ...args: any[]): void =>
		this.sendCommand(IpcExecCommand, { command: `taskexplorer.${command}`, args });


    private executeUpdateConfig = (key: string, value?: any): void =>
		this.sendCommand(IpcUpdateConfigCommand, { key: `taskMonitor.${key}`, value });


	private handleTaskStateChangeEvent = (params: DidChangeTaskStatusParams): void =>
	{
		const tIdx = this.state.tasks.findIndex(t => params.task.treeId === t.treeId);
		if (tIdx !== -1) {
			this.state.tasks.splice(tIdx, 1, params.task);
			this.setState(this.state);
		}
		this.app.setTask(params.task);
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
		const msg = e.data as IIpcMessage;
		switch (msg.method)
		{
			case IpcDidChangeAllTasks.method:
				onIpc(IpcDidChangeAllTasks, msg, params => {
					Object.assign(this.state, { ...params });
					this.log(`onMessageReceived(${msg.id}): name=${msg.method}`);
					this.app.setTasks("all", this.state.tasks);
					this.setState(this.state);
				});
				break;
			case IpcDidChangeLastTasks.method:
				onIpc(IpcDidChangeLastTasks, msg, params => {
					this.state.last = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.last);
					this.app.setTasks("last", this.state.last);
				});
				break;
			case IpcDidChangeRunningTasks.method:
				onIpc(IpcDidChangeRunningTasks, msg, params => {
					this.state.running = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.running);
					this.app.setTasks("running", this.state.running);
				});
				break;
			case IpcDidChangeFamousTasks.method:
				onIpc(IpcDidChangeFamousTasks, msg, params => {
					this.state.famous = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.famous);
					this.app.setTasks("famous", this.state.famous);
				});
				break;
			case IpcDidChangeFavoriteTasks.method:
				onIpc(IpcDidChangeFavoriteTasks, msg, params => {
					this.state.favorites = [ ...params.tasks ];
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} tasks=`, this.state.favorites);
					this.app.setTasks("favorites", this.state.favorites);
				});
				break;
			case IpcDidChangeTaskStatus.method:
				onIpc(IpcDidChangeTaskStatus, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, params);
					this.handleTaskStateChangeEvent(params);
				});
				break;
			case IpcDidChangeState.method:
				onIpc(IpcDidChangeState, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, params);
					this.processBaseStateChange(params);
				});
				break;
			case IpcDidChangeConfig.method:
				onIpc(IpcDidChangeConfig, msg, params => {
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


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
	IpcStateChangedParams, IpcStateChangedMsg, IpcTaskChangedMsg, IpcTasksChangedMsg, IIpcMessage,
	onIpc, MonitorAppState, IpcTaskChangedParams, IpcExecCommand, IpcConfigChangedMsg, IpcUpdateConfigCommand
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


	private handleTaskChangeEvent = (params: IpcTaskChangedParams): void =>
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
		this.log("onInitialize", 1);
		//
		// TODO - Test what vscode.getState/setState is all about...
		//
		const state = this.getState();
		if (state) {
			console.log("!!!");
			console.log("!!! VSCODE GETSTATE()");
			console.log(state);
			console.log("!!!");
		}
	};


    protected override onBind = (): Disposable[] =>
    {
		this.log("onBind", 1);
		const disposables = [],
			  rootEl = document.getElementById("root") as HTMLElement,
			  bodyMouseDownHandler = this.onBodyMouseDown.bind(this),
			  root = createRoot(rootEl);
        root.render(
			<App
				ref={this.appRef}
				state={this.state}
				log={this.log.bind(this)}
				executeCommand={this.executeCommand.bind(this)}
				updateConfig={this.executeUpdateConfig.bind(this)}
			/>
        );
		rootEl.addEventListener("mousedown", bodyMouseDownHandler);
        disposables.push({
			dispose: () => {
				rootEl.removeEventListener("mousedown", bodyMouseDownHandler);
				root.unmount();
			}
		});
		return disposables;
	};


	protected override onMessageReceived = (e: MessageEvent): void =>
    {
		const msg = e.data as IIpcMessage;
		switch (msg.method)
		{
			case IpcTasksChangedMsg.method:
				onIpc(IpcTasksChangedMsg, msg, params => {
					Object.assign(this.state, { ...params });
					this.log(`onMessageReceived(${msg.id}): name=${msg.method}`, 1);
					this.app.setTasks(params.list, this.state.tasks);
					this.setState(this.state);
				});
				break;
			case IpcTaskChangedMsg.method:
				onIpc(IpcTaskChangedMsg, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, 1, params);
					this.handleTaskChangeEvent(params);
				});
				break;
			case IpcStateChangedMsg.method:
				onIpc(IpcStateChangedMsg, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, 1, params);
					this.processBaseStateChange(params);
				});
				break;
			case IpcConfigChangedMsg.method:
				onIpc(IpcConfigChangedMsg, msg, params => {
					this.log(`onMessageReceived(${msg.id}): name=${msg.method} params=`, 1, params);
					this.app.setTimerMode(params.timerMode);
				});
				break;
			default:
				super.onMessageReceived?.(e);
		}
	};


	private onBodyMouseDown = (e: MouseEvent) => this.appRef.current?.handleBodyMouseDown(e);


	private processBaseStateChange = (params: IpcStateChangedParams): void =>
    {
		this.log("processBaseStateChange", 1);
		Object.assign(this.state, { ...params  });
		// this.setState(this.state);
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
	};


	protected override setState = (state: MonitorAppState): void =>
    {
		this.log("setState", 1, state);
		Object.assign(this.state, { ...state  });
		// super.setState(state); // TODO - Check out how to use internally provided vscode state
	};

}

new TaskMonitorWebviewApp();

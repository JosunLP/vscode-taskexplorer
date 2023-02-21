
import "../common/css/vscode.css";
import "../common/css/react.css";
import "../common/css/tabs.css";
import "../common/css/page.css";
import "./monitor.css";
import "./monitor.scss";

import React, { useRef, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

import { State } from "../../common/state";
import { TeWebviewApp } from "../webviewApp";
import { TeTaskControl } from "./cmp/control";
// eslint-disable-next-line import/extensions
import { createRoot } from "react-dom/client";
import { DidChangeStateType, IpcMessage, IpcNotificationType, onIpc, StateChangedCallback } from "../../common/ipc";

export interface AppMonitorState extends State
{
	seconds: number;
	taskType: string;
};

class TaskMonitorWebviewApp extends TeWebviewApp<State>
{
    private callback?: StateChangedCallback;

    constructor()
    {
		super("TaskMonitorWebviewApp");
	}


	protected override onInitialize()
	{
		this.log(`${this.appName}.onInitialize`);
		this.state = this.getState<AppMonitorState>() ?? this.state;
		if (this.state) {
			Object.assign(this.state, {
				seconds: 0,
				taskType: "ant"
			});
		 	this.refresh(this.state);
		}
		// const [ tasks, setTasks ] = useState(this.state.param1 ?? []);
	}


    protected override onBind()
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
						<Tab>Famous</Tab>
					</TabList>
					<TabPanel>
						<TeTaskControl
							id="te-id-view-monitor-control-recent"
							state={Object.assign({}, this.state, { seconds: 0, taskType: "ant" })}
							subscribe={(callback: StateChangedCallback) => this.registerEvents(callback)}
						/>
					</TabPanel>
					<TabPanel>
						<TeTaskControl
							id="te-id-view-monitor-control-running"
							state={Object.assign({}, this.state, { seconds: 10, taskType: "gulp" })}
							subscribe={(callback: StateChangedCallback) => this.registerEvents(callback)}
						/>
					</TabPanel>
					<TabPanel>
						<TeTaskControl
							id="te-id-view-monitor-control-famous"
							state={Object.assign({}, this.state, { seconds: 20, taskType: "grunt" })}
							subscribe={(callback: StateChangedCallback) => this.registerEvents(callback)}
						/>
					</TabPanel>
				</Tabs>
			</div>
        );

        disposables.push({
            dispose: () => root.unmount()
        });

		return disposables;
	}


	private onTabSelected = (index: number, lastIndex: number) =>
	{
		this.log(`${this.appName}.onTabSelected: index=${index}: lastIdex=${lastIndex}`);
	};


	protected override onMessageReceived = (e: MessageEvent) =>
    {
		const msg = e.data as IpcMessage;
		this.log(`${this.appName}.onMessageReceived(${msg.id}): name=${msg.method}`);

		switch (msg.method) {
			case DidChangeStateType.method:
				onIpc(DidChangeStateType, msg, params => {
					(this.state as any) = params;
					this.updateState();
				});
				break;
			default:
				super.onMessageReceived?.(e);
		}
	};


	protected override setState = (state: State, type?: IpcNotificationType<any>) => // | InternalNotificationType)
    {
		this.log(`${this.appName}.setState`);
		this.state = state;
		// super.setState(state); // Don't call base (for now), not using internally provided vscode state
		this.callback?.(this.state, type);
	};


	private registerEvents = (callback: StateChangedCallback): (() => void) =>
    {
		this.callback = callback;
		return () => {
			this.callback = undefined;
		};
	};


	private refresh = (state: State) =>
	{
		// const taskControlRef =  ReactDOM.findDOMNode(this);// document.getElementById("te-id-task-control") as HTMLElement;
		// taskControlRef.innerHTML = "";
		// taskControlRef.
	};

}

new TaskMonitorWebviewApp();

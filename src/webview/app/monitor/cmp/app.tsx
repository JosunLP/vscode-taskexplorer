/* eslint-disable @typescript-eslint/naming-convention */
import React, { useEffect } from "react";
import { TeTaskControlWrapper } from "./control";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
    DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType,
    DidChangeRunningTasksType, DidChangeTaskType, IpcNotificationType, ITask, StateChangedCallback
} from "../../../common/ipc";

interface State
{
	tasks: ITask[];
	famous: ITask[];
	favorites: ITask[];
	last: ITask[];
	running: ITask[];
    webroot: string;
}

let updateLastTasks: StateChangedCallback | undefined;
let updateRunningTasks: StateChangedCallback | undefined;
let updateFavoriteTasks: StateChangedCallback | undefined;
let updateFamousTasks: StateChangedCallback | undefined;


export const AppWrapper = (props: { state: State; subscribe: any }) =>
{
    const updateState = (state: State, type?: IpcNotificationType<any>) =>
    {
		switch (type) {
            case DidChangeTaskType:
                console.log("UPDATESTATE: DidChangeTaskType");
                updateLastTasks?.({ tasks: state.last });
                break;
            case DidChangeLastTasksType:
                console.log("UPDATESTATE: DidChangeLastTasksType");
                updateLastTasks?.({ tasks: state.last });
                break;
            case DidChangeFavoriteTasksType:
                console.log("UPDATESTATE: DidChangeFavoriteTasksType");
                updateFavoriteTasks?.({ tasks: state.favorites });
                break;
            case DidChangeFamousTasksType:
                console.log("UPDATESTATE: DidChangeFamousTasksType");
                updateFamousTasks?.({ tasks: state.famous });
                break;
            case DidChangeRunningTasksType:
                console.log("UPDATESTATE: DidChangeRunningTasksType");
                updateRunningTasks?.({ tasks: state.running });
                break;
        }
    };
	useEffect(() => props.subscribe?.(updateState), []);

    return (
        <>
            <App state={props.state } />
        </>
    );
};


class App extends React.Component<{ state: State }, State>
{
    constructor(props: { state: State })
    {
        super(props);
        this.state = props.state;
    }

    override render = () =>
    {
        return (
            <div className="te-tabs-container">
                <Tabs className="te-tabs" /* selectedIndex={tabIndex} */ onSelect={this.onTabSelected} forceRenderTabPanel={true} defaultFocus={true}>
                    <TabList>
                        <Tab className="react-tabs__tab te-tab-recent">Recent</Tab>
                        <Tab className="react-tabs__tab te-tab-running">Running</Tab>
                        <Tab className="react-tabs__tab te-tab-favorites">Favorites</Tab>
                        <Tab className="react-tabs__tab te-tab-famous">Famous</Tab>
                    </TabList>
                    <TabPanel>
                        <TeTaskControlWrapper
                            id="te-id-view-monitor-control-recent"
                            tasks={this.props.state.last}
                            state={{ tasks: this.props.state.last, webroot: this.props.state.webroot }}
                            subscribe={(callback: StateChangedCallback) => registerUpdateLastTasks(callback)}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControlWrapper
                            id="te-id-view-monitor-control-running"
                            tasks={this.props.state.running}
                            state={{ seconds: 0, tasks: this.props.state.running, webroot: this.props.state.webroot }}
                            subscribe={(callback: StateChangedCallback) => registerUpdateRunningTasks(callback)}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControlWrapper
                            id="te-id-view-monitor-control-favorites"
                            tasks={this.props.state.favorites}
                            state={{ tasks: this.props.state.favorites, webroot: this.props.state.webroot }}
                            subscribe={(callback: StateChangedCallback) => registerUpdateFavoriteTasks(callback)}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControlWrapper
                            id="te-id-view-monitor-control-famous"
                            tasks={this.props.state.famous}
                            state={{ tasks: this.props.state.famous, webroot: this.props.state.webroot }}
                            subscribe={(callback: StateChangedCallback) => registerUpdateFamousTasks(callback)}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        );
    };

    private onTabSelected = (index: number, lastIndex: number) =>
    {
        // this.log(`${this.appName}.onTabSelected: index=${index}: lastIdex=${lastIndex}`);
    };
}


const registerUpdateLastTasks = (callback: StateChangedCallback): (() => void) =>
{
    updateLastTasks = callback;
    return () => {
        updateLastTasks = undefined;
    };
};


const registerUpdateRunningTasks = (callback: StateChangedCallback): (() => void) =>
{
    updateRunningTasks = callback;
    return () => {
        updateRunningTasks = undefined;
    };
};


const registerUpdateFavoriteTasks = (callback: StateChangedCallback): (() => void) =>
{
    updateFavoriteTasks = callback;
    return () => {
        updateFavoriteTasks = undefined;
    };
};


const registerUpdateFamousTasks = (callback: StateChangedCallback): (() => void) =>
{
    updateFamousTasks = callback;
    return () => {
        updateFamousTasks = undefined;
    };
};

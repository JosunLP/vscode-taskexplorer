/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import { TeTaskControl } from "./control";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
    DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType,
    DidChangeRunningTasksType, DidChangeTaskType, IpcNotificationType, ITask, MonitorAppState, StateChangedCallback
} from "../../../common/ipc";

interface IControls {
    recent: React.RefObject<TeTaskControl>;
    running: React.RefObject<TeTaskControl>;
    favorites: React.RefObject<TeTaskControl>;
    famous: React.RefObject<TeTaskControl>;
};

interface AppState extends MonitorAppState
{
	showHideDemo1: boolean;
    showHideDemo2: boolean;
    showHideDemo3: boolean;
    controls: IControls;
}


export class App extends React.Component<{ state: MonitorAppState }, AppState>
{
    constructor(props: { state: MonitorAppState })
    {
        super(props);
        this.state = {
            showHideDemo1: false,
            showHideDemo2: false,
            showHideDemo3: false,
            controls: {
                recent: React.createRef<TeTaskControl>(),
                running: React.createRef<TeTaskControl>(),
                favorites: React.createRef<TeTaskControl>(),
                famous: React.createRef<TeTaskControl>()
            },
            ...props.state
        };
        // this.hideComponent = this.hideComponent.bind(this);
    }


    hideComponent = (name: string) =>
    {
        console.log(name);
        switch (name) {
          case "showHideDemo1":
            this.setState({ showHideDemo1: !this.state.showHideDemo1 });
            break;
          case "showHideDemo2":
            this.setState({ showHideDemo2: !this.state.showHideDemo2 });
            break;
          case "showHideDemo3":
            this.setState({ showHideDemo3: !this.state.showHideDemo3 });
            break;
          default:
            break;
        }
    };


    updateTasks = (state: MonitorAppState, type?: IpcNotificationType<any>) =>
    {
        switch (type) {
            case DidChangeTaskType:
                break;
            case DidChangeLastTasksType:
                this.state.controls.recent.current?.setTasks(state.last);
                break;
            case DidChangeFavoriteTasksType:
                this.state.controls.favorites.current?.setTasks(state.favorites);
                break;
            case DidChangeFamousTasksType:
                this.state.controls.famous.current?.setTasks(state.famous);
                break;
            case DidChangeRunningTasksType:
                this.state.controls.running.current?.setTasks(state.running);
                break;
        }
    };


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
                        <TeTaskControl
                            id="te-id-view-monitor-control-recent"
                            ref={this.state.controls.recent}
                            tasks={this.props.state.last}
                            webroot={this.props.state.webroot}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControl
                            id="te-id-view-monitor-control-running"
                            ref={this.state.controls.running}
                            startTimer={true}
                            tasks={this.props.state.running}
                            webroot={this.props.state.webroot}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControl
                            id="te-id-view-monitor-control-favorites"
                            ref={this.state.controls.favorites}
                            tasks={this.props.state.favorites}
                            webroot={this.props.state.webroot}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControl
                            id="te-id-view-monitor-control-famous"
                            ref={this.state.controls.famous}
                            tasks={this.props.state.famous}
                            webroot={this.props.state.webroot}
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

    private clearTasks = () =>
    {
        // await storage.update("lastTasks", []);
    };
}

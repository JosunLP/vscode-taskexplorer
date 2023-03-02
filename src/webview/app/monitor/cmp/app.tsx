/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import { AppMenu } from "./menu";
import { TeTaskTab } from "./tab";
import { AppMenuButton } from "./menuButton";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { IIpcTask, IIpcTaskListType, IMonitorAppTimerMode, MonitorAppSerializedState, MonitorAppState } from "../../../common/ipc";

type ITabDictionary<T> = { [id in IIpcTaskListType]: T; };

interface ITeAppTabs extends ITabDictionary<React.RefObject<TeTaskTab>>
{
    all: React.RefObject<TeTaskTab>;
    famous: React.RefObject<TeTaskTab>;
    favorites: React.RefObject<TeTaskTab>;
    last: React.RefObject<TeTaskTab>;
    running: React.RefObject<TeTaskTab>;
};

interface ReactProps
{
    state: MonitorAppState;
    executeCommand: (command: string, ...args: any[]) => void;
    log: (message: string, ...optionalParams: any[]) => void;
    updateConfig: (key: string, value?: any) => void;
}


export class App extends React.Component<ReactProps, MonitorAppState, MonitorAppSerializedState>
{
    private tabs: ITeAppTabs;
    private log: (message: string, ...optionalParams: any[]) => void;


    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.tabs = {
            all: React.createRef<TeTaskTab>(),
            famous: React.createRef<TeTaskTab>(),
            favorites: React.createRef<TeTaskTab>(),
            last: React.createRef<TeTaskTab>(),
            running: React.createRef<TeTaskTab>()
        };
        this.state = {
            ...props.state
        };
    }


    private handleMouseDown = (_e: React.MouseEvent<HTMLElement, MouseEvent>) =>
    {
        if (this.state.menuVisible) {
            this.toggleMenu();
        }
    };


    private handleMenuMouseDown = (e: React.MouseEvent<HTMLElement, MouseEvent>) =>
    {
        this.toggleMenu();
        e.stopPropagation();
    };


    private onTabSelected = (index: number, lastIndex: number) =>
    {
        this.log(`onTabSelected: index=${index}: lastIndex=${lastIndex}`);
    };


    override render = () =>
    {
        return (
            <div className="te-tabs-container" onMouseDown={this.handleMouseDown}>
                <Tabs className="te-tabs" /* selectedIndex={tabIndex} */ onSelect={this.onTabSelected} forceRenderTabPanel={true} defaultFocus={true}>
                    <AppMenuButton
                        handleMouseDown={this.handleMenuMouseDown.bind(this)}
                    />
                    <AppMenu
                        log={this.log}
                        handleMouseDown={this.handleMenuMouseDown.bind(this)}
                        menuVisibility={!!this.state.menuVisible}
                        timerMode={this.state.timerMode}
                        updateConfig = {this.props.updateConfig}
                        executeCommand={this.props.executeCommand}
                    />
                    <TabList>
                        <Tab className="react-tabs__tab te-tab-recent">Recent</Tab>
                        <Tab className="react-tabs__tab te-tab-running">Running</Tab>
                        <Tab className="react-tabs__tab te-tab-favorites">Favorites</Tab>
                        <Tab className="react-tabs__tab te-tab-famous">Famous</Tab>
                        <Tab className="react-tabs__tab te-tab-all">All</Tab>
                    </TabList>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            name="last"
                            ref={this.tabs.last}
                            tasks={this.props.state.last}
                            timerMode={this.state.timerMode}
                            webroot={this.props.state.webroot}
                            executeCommand={this.props.executeCommand}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            name="running"
                            ref={this.tabs.running}
                            tasks={this.props.state.running}
                            timerMode={this.state.timerMode}
                            webroot={this.props.state.webroot}
                            executeCommand={this.props.executeCommand}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            name="favorites"
                            ref={this.tabs.favorites}
                            tasks={this.props.state.favorites}
                            timerMode={this.state.timerMode}
                            webroot={this.props.state.webroot}
                            executeCommand={this.props.executeCommand}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            name="famous"
                            ref={this.tabs.famous}
                            tasks={this.props.state.famous}
                            timerMode={this.state.timerMode}
                            webroot={this.props.state.webroot}
                            executeCommand={this.props.executeCommand}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            name="all"
                            ref={this.tabs.all}
                            tasks={this.props.state.tasks}
                            timerMode={this.state.timerMode}
                            webroot={this.props.state.webroot}
                            executeCommand={this.props.executeCommand}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        );
    };


    setTask = (task: IIpcTask) =>
    {
        this.tabs.all.current?.setTask(task);
        this.tabs.famous.current?.setTask(task);
        this.tabs.favorites.current?.setTask(task);
        this.tabs.last.current?.setTask(task);
        this.tabs.running.current?.setTask(task);
    };


    setTasks = (listType: IIpcTaskListType, tasks: IIpcTask[]) => void this.tabs[listType]?.current?.setTasks(tasks);


    setTimerMode = (mode: IMonitorAppTimerMode) => { if (this.state.timerMode !== mode) { this.setState({ timerMode: mode }); }};


    toggleMenu = () => this.setState(state => ({ menuVisible: !state.menuVisible }));

}

/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import { AppMenu } from "./menu";
import { TeTaskTab } from "./tab";
import { AppLoadMask } from "./loadMask";
import { AppMenuButton } from "./menuButton";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
    IMonitorAppTimerMode, MonitorAppSnapShot, MonitorAppState
} from "../../../common/ipc";
import { ITeTask, TeTaskListType } from ":env/ipc";

type ITabDictionary<T> = { [id in TeTaskListType]: T; };

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
    log: (message: string, level: number, ...args: any[]) => void;
    updateConfig: (key: string, value?: any) => void;
    // onBodyMouseDown: React.MouseEvent<HTMLBodyElement>;
}


export class App extends React.Component<ReactProps, MonitorAppState, MonitorAppSnapShot>
{
    private tabs: ITeAppTabs;
    private log: (message: string, level: number, ...args: any[]) => void;


    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.log("App.constructor", 1);
        this.tabs = {
            all: React.createRef<TeTaskTab>(),
            famous: React.createRef<TeTaskTab>(),
            favorites: React.createRef<TeTaskTab>(),
            last: React.createRef<TeTaskTab>(),
            running: React.createRef<TeTaskTab>()
        };
        this.state = {
            ...props.state, ...{ loadMaskVisible: true }
        };
    }


    override componentDidMount = (): void => this.hideMask();


    override componentDidUpdate = (): void => this.hideMask();


    handleFocusChanged = (focused: boolean): void  =>
    {
        if (!focused && this.state.menuVisible) {
            this.toggleMenu();
        }
    };


    handleBodyMouseDown = (e: MouseEvent): void  =>
    {
        if (this.state.menuVisible)
        {
            const menuEl = document.getElementById("te-monitor-flyout-menu-id");
            if (menuEl) {
                if (e.clientY > menuEl.clientHeight && e.clientX < screen.availWidth - menuEl.clientWidth) {
                    this.toggleMenu();
                }
            }
        }
    };


    private handleMouseDown = (_e: React.MouseEvent<HTMLElement, MouseEvent>): void  =>
    {
        if (this.state.menuVisible) {
            this.toggleMenu();
        }
    };


    private handleMenuMouseDown = (e: React.MouseEvent<HTMLElement, MouseEvent>): void  =>
    {
        this.toggleMenu();
        e.stopPropagation();
    };


    private hideMask = (): void => { if (this.state.loadMaskVisible) setTimeout((s) => this.setState(s), 100, { loadMaskVisible: false }); };


    private onTabSelected = (idx: number, lstIdx: number): void => this.log(`App.onTabSelected: idx=${idx}: lstIdx=${lstIdx}`, 2);


    override render = (): JSX.Element =>
    {
        this.log("App.render", 1);
        return (
            <div className="te-tabs-container" onMouseDown={this.handleMouseDown}>
                <Tabs className="te-tabs" /* selectedIndex={tabIndex} */ onSelect={this.onTabSelected} forceRenderTabPanel={true} defaultFocus={true}>
                    <AppLoadMask
                        log={this.log}
                        maskVisibility={!!this.state.loadMaskVisible}
                    />
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


    setTask = (task: ITeTask): void  =>
    {
        this.tabs.all.current?.setTask(task);
        this.tabs.famous.current?.setTask(task);
        this.tabs.favorites.current?.setTask(task);
        this.tabs.last.current?.setTask(task);
        this.tabs.running.current?.setTask(task);
    };


    setTasks = (listType: TeTaskListType, tasks: ITeTask[]): void  => void this.tabs[listType]?.current?.setTasks(tasks);


    setTimerMode = (mode: IMonitorAppTimerMode): void  => { if (this.state.timerMode !== mode) { this.setState({ timerMode: mode }); }};


    toggleMenu = (): void  => this.setState(state => ({ menuVisible: !state.menuVisible }));

}

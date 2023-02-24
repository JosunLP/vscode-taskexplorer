/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import { TeTaskTab } from "./tab";
import { MonitorAppState } from "../../../common/ipc";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

interface ITeAppTabs {
    recent: React.RefObject<TeTaskTab>;
    running: React.RefObject<TeTaskTab>;
    favorites: React.RefObject<TeTaskTab>;
    famous: React.RefObject<TeTaskTab>;
};

interface ReactProps
{
    log: (message: string, ...optionalParams: any[]) => void;
    state: MonitorAppState;
}


export class App extends React.Component<ReactProps, MonitorAppState>
{
    private log: (message: string, ...optionalParams: any[]) => void;
    private tabs: ITeAppTabs;

    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.tabs = {
            recent: React.createRef<TeTaskTab>(),
            running: React.createRef<TeTaskTab>(),
            favorites: React.createRef<TeTaskTab>(),
            famous: React.createRef<TeTaskTab>()
        };
        this.state = {
            ...props.state
        };
    }


    get famousTab() {
        return this.tabs.famous.current as TeTaskTab;
    }

    get favoritesTab() {
        return this.tabs.favorites.current as TeTaskTab;
    }

    get recentTab() {
        return this.tabs.recent.current as TeTaskTab;
    }

    get runningTab() {
        return this.tabs.running.current as TeTaskTab;
    }


    private clearTasks = () =>
    {
        // await storage.update("lastTasks", []);
    };


    private onTabSelected = (index: number, lastIndex: number) =>
    {
        this.log(`onTabSelected: index=${index}: lastIdex=${lastIndex}`);
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
                        <TeTaskTab
                            log={this.log}
                            ref={this.tabs.recent}
                            tasks={this.props.state.last}
                            webroot={this.props.state.webroot}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            ref={this.tabs.running}
                            startTimer={true}
                            tasks={this.props.state.running}
                            webroot={this.props.state.webroot}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            ref={this.tabs.favorites}
                            tasks={this.props.state.favorites}
                            webroot={this.props.state.webroot}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskTab
                            log={this.log}
                            ref={this.tabs.famous}
                            tasks={this.props.state.famous}
                            webroot={this.props.state.webroot}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        );
    };

}

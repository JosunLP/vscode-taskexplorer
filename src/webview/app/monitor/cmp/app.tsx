/* eslint-disable @typescript-eslint/naming-convention */
// export default {};

import { TeTaskControl } from "./control";
import { ReactProps } from "../../common/react";
import React, { useEffect, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
    DidChangeFamousTasksType,
    DidChangeFavoriteTasksType, DidChangeLastTasksType, DidChangeRunningTasksType,
    DidChangeTaskType, IpcNotificationType, ITask
} from "../../../common/ipc";

interface State
{
	tasks: ITask[];
	famous: ITask[];
	favorites: ITask[];
	lastTasks: ITask[];
	runningTasks: ITask[];
    webroot: string;
}

const onTabSelected = (index: number, lastIndex: number) =>
{
    // this.log(`${this.appName}.onTabSelected: index=${index}: lastIdex=${lastIndex}`);
};

export const AppWrapper = (props: ReactProps) =>
{
    console.log(props);

    const [ tasks, setTasks ] = useState(props.state.tasks);
    const [ lastTasks, setLastTasks ] = useState(props.state.lastTasks);
    const [ famousTasks, setFamousTasks ] = useState(props.state.famous);
    const [ favoriteTasks, setFavoriteTasks ] = useState(props.state.favorites);
    const [ runningTasks, setRunningTasks ] = useState(props.state.runningTasks);

    const updateState = (state: State, type?: IpcNotificationType<any>) =>
    {
		switch (type) {
            case DidChangeTaskType:
                setTasks(state.tasks);
                break;
            case DidChangeLastTasksType:
                setLastTasks(state.lastTasks);
                break;
            case DidChangeFavoriteTasksType:
                setFavoriteTasks(state.favorites);
                break;
            case DidChangeFamousTasksType:
                setFamousTasks(state.famous);
                break;
            case DidChangeRunningTasksType:
                setRunningTasks(state.runningTasks);
                break;
        }
    };
	useEffect(() => props.subscribe?.(updateState), []);

    return (
        <>
            <div className="te-tabs-container">
                <Tabs className="te-tabs" /* selectedIndex={tabIndex} */ onSelect={onTabSelected} forceRenderTabPanel={true} defaultFocus={true}>
                    <TabList>
                        <Tab>Recent</Tab>
                        <Tab>Running</Tab>
                        <Tab>Favorites</Tab>
                        <Tab>Famous</Tab>
                    </TabList>
                    <TabPanel>
                        <TeTaskControl
                            id="te-id-view-monitor-control-recent"
                            state={{ tasks: lastTasks, webroot: props.state.webroot }}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControl
                            id="te-id-view-monitor-control-recent"
                            state={{ tasks: runningTasks, seconds: 0, webroot: props.state.webroot }}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControl
                            id="te-id-view-monitor-control-favorites"
                            state={{ tasks: favoriteTasks, webroot: props.state.webroot }}
                        />
                    </TabPanel>
                    <TabPanel>
                        <TeTaskControl
                            id="te-id-view-monitor-control-famous"
                            state={{ tasks: famousTasks, webroot: props.state.webroot }}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </>
    );
};


export default AppWrapper;

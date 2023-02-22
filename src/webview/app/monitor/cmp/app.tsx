/* eslint-disable @typescript-eslint/naming-convention */
// export default {};

import { TeTaskControl } from "./control";
import { ReactProps } from "../../common/react";
import React, { useEffect, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
    DidChangeFamousTasksType, DidChangeFavoriteTasksType, DidChangeLastTasksType,
    DidChangeRunningTasksType, DidChangeTaskType, IpcNotificationType, ITask
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

const onTabSelected = (index: number, lastIndex: number) =>
{
    // this.log(`${this.appName}.onTabSelected: index=${index}: lastIdex=${lastIndex}`);
};

export const AppWrapper = (props: ReactProps) =>
{
    console.log("[TEST]: AppWrapper");
    console.log(props);

    const [ lastTasks, setLastTasks ] = useState(props.state.last);
    const [ famousTasks, setFamousTasks ] = useState(props.state.famous);
    const [ favoriteTasks, setFavoriteTasks ] = useState(props.state.favorites);
    const [ runningTasks, setRunningTasks ] = useState(props.state.running);

    const updateState = (state: State, type?: IpcNotificationType<any>) =>
    {
        console.log("[TEST]: AppWrapper UPDATESTATE");
        console.log(state);
		switch (type) {
            case DidChangeTaskType:
                console.log("UPDATESTATE: DidChangeTaskType");
                setLastTasks(state.last);
                break;
            case DidChangeLastTasksType:
                console.log("UPDATESTATE: DidChangeLastTasksType");
                setLastTasks(state.last);
                break;
            case DidChangeFavoriteTasksType:
                console.log("UPDATESTATE: DidChangeFavoriteTasksType");
                setFavoriteTasks(state.favorites);
                break;
            case DidChangeFamousTasksType:
                console.log("UPDATESTATE: DidChangeFamousTasksType");
                setFamousTasks(state.famous);
                break;
            case DidChangeRunningTasksType:
                console.log("UPDATESTATE: DidChangeRunningTasksType");
                setRunningTasks(state.running);
                break;
        }
    };
	useEffect(() => props.subscribe?.(updateState), []);

    return (
    <>
        <div className="te-tabs-container">
            <Tabs className="te-tabs"  onSelect={onTabSelected} forceRenderTabPanel={true} defaultFocus={true}>
                <TabList>
                    <Tab className="react-tabs__tab te-tab-recent">Recent</Tab>
                    <Tab className="react-tabs__tab te-tab-running">Running</Tab>
                    <Tab className="react-tabs__tab te-tab-favorites">Favorites</Tab>
                    <Tab className="react-tabs__tab te-tab-famous">Famous</Tab>
                </TabList>
                <TabPanel>
                    <TeTaskControl
                        id="te-id-view-monitor-control-recent"
                        tasks={lastTasks}
                        state={{ tasks: lastTasks, webroot: props.state.webroot }}
                    />
                </TabPanel>
                <TabPanel>
                    <TeTaskControl
                        id="te-id-view-monitor-control-running"
                        tasks={runningTasks}
                        state={{ seconds: 0, tasks: runningTasks, webroot: props.state.webroot }}
                    />
                </TabPanel>
                <TabPanel>
                    <TeTaskControl
                        id="te-id-view-monitor-control-favorites"
                        tasks={favoriteTasks}
                        state={{ tasks: favoriteTasks, webroot: props.state.webroot }}
                    />
                </TabPanel>
                <TabPanel>
                    <TeTaskControl
                        id="te-id-view-monitor-control-famous"
                        tasks={famousTasks}
                        state={{ tasks: famousTasks, webroot: props.state.webroot }}
                    />
                </TabPanel>
            </Tabs>
        </div>
    </>);
};

// export class App extends React.Component<ReactProps, State>
// {
//     private id: string | undefined;
//     private counter = 0;
//     // private controlState: ControlStates;
//
//     constructor(props: ReactProps)
//     {
//         super(props);
//         console.log("[TEST]: App");
//         console.log(props);
//         this.id = props.id;
//         this.state = props.state;
//        // this.controlState = {
//        //     last: Object.assign({}, { tasks: props.state.lastTasks, webroot: props.state.webroot }),
//        //     running: Object.assign({}, { seconds: 10, tasks: [ ...props.state.runningTasks ], webroot: props.state.webroot }),
//        //     favorites: Object.assign({}, { seconds: 20, tasks: [ ...props.state.favorites ], webroot: props.state.webroot }),
//        //     famous: Object.assign({}, { seconds: 30, tasks: [ ...props.state.favorites ], webroot: props.state.webroot }),
//        // };
//         // props.subscribe = (state: State, type?: IpcNotificationType<any>) =>
//         // {
//         //     console.log("UPDATESTATE!!!");
//         //     switch (type) {
//         //         case DidChangeTaskType:
//         //             console.log("UPDATESTATE: DidChangeTaskType");
//         //             // setTasks(state.tasks);
//         //             controlStates.last.tasks = state.tasks;
//         //             this.setState({ last: state.last });
//         //             break;
//         //         case DidChangeLastTasksType:
//         //             console.log("UPDATESTATE: DidChangeLastTasksType");
//         //             break;
//         //         case DidChangeFavoriteTasksType:
//         //             console.log("UPDATESTATE: DidChangeFavoriteTasksType");
//         //             break;
//         //         case DidChangeFamousTasksType:
//         //             console.log("UPDATESTATE: DidChangeFamousTasksType");
//         //             break;
//         //         case DidChangeRunningTasksType:
//         //             console.log("UPDATESTATE: DidChangeRunningTasksType");
//         //             break;
//         //     }
//         // };
//         // props.subscribe = updateState;
//         // useEffect(() => props.subscribe?.(updateState), []);
//     }
//
//
//     // override componentDidMount()
//     // {
//     //     const updateState = (state: State, type?: IpcNotificationType<any>) =>
//     //     {
//     //         console.log("App UPDATESTATE");
//     //         switch (type) {
//     //             case DidChangeTaskType:
//     //                 console.log("UPDATESTATE: DidChangeTaskType");
//     //                 // setTasks(state.tasks);
//     //                 controlStates.last.tasks = state.tasks;
//     //                 this.setState({ last: state.last });
//     //                 break;
//     //             case DidChangeLastTasksType:
//     //                 console.log("UPDATESTATE: DidChangeLastTasksType");
//     //                 break;
//     //             case DidChangeFavoriteTasksType:
//     //                 console.log("UPDATESTATE: DidChangeFavoriteTasksType");
//     //                 break;
//     //             case DidChangeFamousTasksType:
//     //                 console.log("UPDATESTATE: DidChangeFamousTasksType");
//     //                 break;
//     //             case DidChangeRunningTasksType:
//     //                 console.log("UPDATESTATE: DidChangeRunningTasksType");
//     //                 break;
//     //         }
//     //     };
//     //     useEffect(() => this.props.subscribe?.(updateState), []);
//     // }
//
//
//     // override componentWillUnmount()
//     // {
//     //     // clearInterval(this.interval as NodeJS.Timeout);
//     // }
//
//     // override componentDidUpdate(props: any)
//     // {
//     //     console.log("App componentDidUpdate");
//     //     console.log(props);
//     //     // this.setState({ tasks: props.tasks });
//     // }
//
//     override render = () =>
//     {
//         console.log("[TEST]: App render");
//         console.log(this.state);
//         return (<>
//         <div className="te-tabs-container">
//             <Tabs className="te-tabs" /* selectedIndex={tabIndex} */ onSelect={onTabSelected} forceRenderTabPanel={true} defaultFocus={true}>
//                 <TabList>
//                     <Tab>Recent</Tab>
//                     <Tab>Running</Tab>
//                     <Tab>Favorites</Tab>
//                     <Tab>Famous</Tab>
//                 </TabList>
//                 <TabPanel>
//                     <TeTaskControl
//                         id="te-id-view-monitor-control-recent"
//                         tasks={this.state.last}
//                         state={{ tasks: this.state.last, webroot: this.state.webroot }}
//                     />
//                 </TabPanel>
//                 <TabPanel>
//                     <TeTaskControl
//                         id="te-id-view-monitor-control-running"
//                         tasks={this.state.running}
//                         state={{  seconds: 0, tasks: this.state.running, webroot: this.state.webroot }}
//                     />
//                 </TabPanel>
//                 <TabPanel>
//                     <TeTaskControl
//                         id="te-id-view-monitor-control-favorites"
//                         tasks={this.state.favorites}
//                         state={{ tasks: this.state.favorites, webroot: this.state.webroot }}
//                     />
//                 </TabPanel>
//                 <TabPanel>
//                     <TeTaskControl
//                         id="te-id-view-monitor-control-famous"
//                         tasks={this.state.famous}
//                         state={{ tasks: this.state.famous, webroot: this.state.webroot }}
//                     />
//                 </TabPanel>
//             </Tabs>
//         </div>
//         </>);
//     };
// }

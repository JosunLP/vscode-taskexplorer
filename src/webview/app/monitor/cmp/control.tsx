/* eslint-disable @typescript-eslint/naming-convention */

import React, { createElement, useEffect, useMemo, useRef, useState } from "react";
import { InternalNotificationType, IpcNotificationType, ITask, StateChangedCallback } from "../../../common/ipc";
import { TeReactTaskTimer } from "./timer";


export interface ControlState
{
    seconds?: number;
	tasks: ITask[];
    webroot: string;
}

interface ReactProps
{
    id?:  string;
    state: any;
    subscribe?: any;
    tasks?: any;
}


export const TeTaskControlWrapper = (props: ReactProps) =>
{
    const [ tasks, setTasks ] = useState(props.tasks);
    const updateState = (state: ControlState) => setTasks(state.tasks);
	useEffect(() => props.subscribe?.(updateState), []);
    return (
        <TeTaskControl
            id={props.id}
            state={props.state}
            subscribe={props.subscribe}
            tasks={tasks}
        />
    );
};


export class TeTaskControl extends React.Component<ReactProps, ControlState>
{
    private id: string | undefined;
    private counter = 0;

    constructor(props: ReactProps)
    {
        super(props);
        this.id = props.id;
        this.state = props.state;
    }


    override componentDidMount = () => console.log("componentDidMount: " + this.id);
    override componentWillUnmount = () => console.log("componentWillUnmount: " + this.id);
    override componentDidUpdate = (props: any) => console.log("componentDidUpdate: " + this.id, props);


    private createControl = (task: ITask) =>
    {
        return <div className="te-monitor-control-container" key={this.id + `-${++this.counter}`}>
            <table width="100%" cellPadding="0" cellSpacing="0">
                <tbody>
                    <tr className="te-monitor-control-row te-monitor-control-top-row">
                        <td className="te-monitor-control-icon-column">
                            <img src={this.state.webroot + "/img/sources/" + task.source + ".svg"} height="70" />
                        </td>
                        <td className="te-monitor-control-content-column">
                            {this.getTaskDetails(task)}
                        </td>
                        {this.getTimer()}
                    </tr>
                </tbody>
            </table>
        </div>;
    };


    private getTaskDetails = (task: ITask) =>
    {
        return <span className="te-monitor-control-content-container">
            <table className="te-monitor-control-content-table">
                <tbody>
                    <tr>
                        <td className="te-monitor-control-content-title">
                            Task Details
                        </td>
                        <td className="te-monitor-control-content-details">
                            {task.name}<br />
                            {task.definition.type}<br />
                            <table>
                                <tbody>
                                    <tr>
                                        <td>
                                            # of Runtimes (Last 7 Days)
                                        </td>
                                        <td>
                                            : &nbsp;xx
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            # of Runtimes (Total)
                                        </td>
                                        <td>
                                            : &nbsp;xx
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </span>;
    };


    private getTimer = () =>
    {
        return this.state.seconds !== undefined ? <td className="te-monitor-control-timer-column">
            <TeReactTaskTimer state={this.state} />
        </td> : <></>;
    };


    override render()
    {
        const els: JSX.Element[] = [];
        this.props.tasks.forEach((t: ITask) => els.push(this.createControl(t)));
        return els;
    }

}

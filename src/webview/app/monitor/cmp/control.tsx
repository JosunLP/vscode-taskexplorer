/* eslint-disable @typescript-eslint/naming-convention */

import React, { createElement, useEffect, useMemo, useRef, useState } from "react";
import { InternalNotificationType, IpcNotificationType, ITask, StateChangedCallback } from "../../../common/ipc";
import { TeReactTaskTimer } from "./timer";


interface ReactState
{
	tasks: ITask[];
}

interface ReactProps
{
    id:  string;
    startTimer?: boolean;
    tasks: ITask[];
    webroot: string;
}

export class TeTaskControl extends React.Component<ReactProps, ReactState>
{
    private id: string | undefined;
    private counter = 0;
    private timerEl;


    constructor(props: ReactProps)
    {
        super(props);
        this.id = props.id;
        this.state = {
            tasks: props.tasks
        };
        this.timerEl = React.createRef<TeReactTaskTimer>();
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
                            <img className="te-monitor-control-icon-img" src={this.props.webroot + "/img/sources/" + task.source + ".svg"} />
                        </td>
                        <td className="te-monitor-control-content-column">
                            {this.getTaskDetails(task)}
                        </td>
                        <td className="te-monitor-control-timer-column">
                            <TeReactTaskTimer ref={this.timerEl} start={task.name === "running"} />
                        </td>
                        <td className="te-monitor-control-button-column">
                            <button onClick={this.clickFavorite} className="te-monitor-control-button-favorite te-monitor-control-button" />
                        </td>
                        <td className="te-monitor-control-button-column">
                            <button onClick={this.clickOpen} className="te-monitor-control-button-open te-monitor-control-button" />
                        </td>
                        <td className="te-monitor-control-button-column te-monitor-control-button-column-last">
                            <button onClick={this.clickRun} className="te-monitor-control-button-run te-monitor-control-button te-monitor-control-button-last" />
                        </td>
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
                            Task Details:
                        </td>
                        <td className="te-monitor-control-content-details">
                            <table>
                                <tbody className="te-monitor-control-content-details-body">
                                    <tr>
                                        <td>
                                            Name
                                        </td>
                                        <td>
                                            &nbsp;&nbsp; : &nbsp;{task.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Type
                                        </td>
                                        <td>
                                            &nbsp;&nbsp; : &nbsp;{task.definition.type}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            # of Runtimes (Last 7 Days)
                                        </td>
                                        <td>
                                            &nbsp;&nbsp; : &nbsp;xx
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            # of Runtimes (Last 30 Days)
                                        </td>
                                        <td>
                                            &nbsp;&nbsp; : &nbsp;xx
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            # of Runtimes (Total)
                                        </td>
                                        <td>
                                            &nbsp;&nbsp; : &nbsp;xx
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


    override render()
    {
        const els: JSX.Element[] = [];
        this.state.tasks.forEach((t: ITask) => els.push(this.createControl(t)));
        return els;
    }

    setTasks = (tasks: ITask[]) => this.setState({ tasks });


    private clickFavorite = () => {

    };


    private clickOpen = () => {

    };


    private clickRun = () => {
        this.timerEl.current?.startTimer();
    };

}

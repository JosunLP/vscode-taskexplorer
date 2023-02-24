/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeReactTaskTimer } from "./timer";
import { ITask } from "../../../common/ipc";


interface ReactState
{
	task: ITask;
}

interface ReactProps
{
    log: (message: string) => void;
    startTimer?: boolean;
    task: ITask;
    webroot: string;
}

export class TeTaskControl extends React.Component<ReactProps, ReactState>
{
    private timerEl;

    constructor(props: ReactProps)
    {
        super(props);
        this.state = {
            task: props.task
        };
        this.timerEl = React.createRef<TeReactTaskTimer>();
    }


    private clickFavorite = () =>  console.log("clickFavorite");
    private clickOpen = () =>  console.log("clickOpen");
    private clickRun = () => this.timerEl.current?.setState({ run: true, seconds: 0 });

    override componentDidMount = () => console.log("componentDidMount: TeTaskControl");
    override componentWillUnmount = () => console.log("componentWillUnmount: TeTaskControl");
    override componentDidUpdate = (props: any) => console.log("componentDidUpdate: TeTaskControl", props);


    private getTaskDetails = () =>
    {
        const task = this.state.task;
        return (
            <span className="te-monitor-control-content-container">
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
            </span>
        );
    };


    override render()
    {
        return (
            <div className="te-monitor-control-container">
                <table width="100%" cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr className="te-monitor-control-row te-monitor-control-top-row">
                            <td className="te-monitor-control-icon-column">
                                <img className="te-monitor-control-icon-img" src={this.props.webroot + "/img/sources/" + this.state.task.source + ".svg"} />
                            </td>
                            <td className="te-monitor-control-content-column">
                                {this.getTaskDetails()}
                            </td>
                            <td className="te-monitor-control-timer-column">
                                <TeReactTaskTimer ref={this.timerEl} start={!!this.props.startTimer} />
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
            </div>
        );
    }

}

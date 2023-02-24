/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeReactTaskTimer } from "./timer";
import { ITask } from "../../../common/ipc";
import { TeTaskButton } from "./button";

interface ITeAppButtons {
    favorite: React.RefObject<TeTaskButton>;
    open: React.RefObject<TeTaskButton>;
    pause: React.RefObject<TeTaskButton>;
    run: React.RefObject<TeTaskButton>;
    stop: React.RefObject<TeTaskButton>;
};

interface ReactState
{
	task: ITask;
}

interface ReactProps
{
    log: (...message: any) => void;
    startTimer?: boolean;
    task: ITask;
    webroot: string;
}


export class TeTaskControl extends React.Component<ReactProps, ReactState>
{
    private timerEl;
    private buttons: ITeAppButtons;
    private log: (...message: any) => void;

    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.timerEl = React.createRef<TeReactTaskTimer>();
        this.buttons = {
            favorite: React.createRef<TeTaskButton>(),
            open: React.createRef<TeTaskButton>(),
            pause: React.createRef<TeTaskButton>(),
            run: React.createRef<TeTaskButton>(),
            stop: React.createRef<TeTaskButton>()
        };
        this.state = {
            task: props.task
        };
    }


    private clickFavorite = () =>  { this.log("TeTaskControl.clickFavorite"); this.timerEl.current?.setState({ run: false }); };
    private clickOpen = () =>  { this.log("TeTaskControl.clickOpen"); this.timerEl.current?.setState({ run: false }); };
    private clickPause = () => { this.log("TeTaskControl.clickPause"); this.timerEl.current?.setState({ run: false }); };
    private clickRun = () => { this.log("TeTaskControl.clickPause"); this.timerEl.current?.setState({ run: true, seconds: 0 }); };
    private clickStop = () => { this.log("TeTaskControl.clickStop"); this.timerEl.current?.setState({ run: false }); };

    override componentDidMount = () => this.log("TeTaskControl.componentDidMount");
    override componentWillUnmount = () => this.log("TeTaskControl.componentWillUnmount");
    override componentDidUpdate = (props: any) => this.log("TeTaskControl.componentDidUpdate", props);


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
                            <TeReactTaskTimer
                                ref={this.timerEl}
                                start={!!this.props.startTimer}
                            />
                            <TeTaskButton
                                name="favorite"
                                ref={this.buttons.favorite}
                                clickHandler={this.clickFavorite.bind(this)}
                            />
                            <TeTaskButton
                                name="open"
                                ref={this.buttons.open}
                                clickHandler={this.clickOpen.bind(this)}
                            />
                            <TeTaskButton
                                name="pause"
                                ref={this.buttons.pause}
                                hidden={!this.state.task.running}
                                clickHandler={this.clickPause.bind(this)}
                            />
                            <TeTaskButton
                                name="stop"
                                lastButton={true}
                                ref={this.buttons.stop}
                                hidden={!this.state.task.running}
                                clickHandler={this.clickStop.bind(this)}
                            />
                            <TeTaskButton
                                name="run"
                                lastButton={true}
                                ref={this.buttons.run}
                                hidden={this.state.task.running}
                                clickHandler={this.clickRun.bind(this)}
                            />
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

}

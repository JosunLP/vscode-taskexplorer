/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeTaskButton } from "./button";
import { TeReactTaskTimer } from "./timer";
import { ITask } from "../../../common/ipc";

interface ITeAppButtons {
    favorite: React.RefObject<TeTaskButton>;
    open: React.RefObject<TeTaskButton>;
    pause: React.RefObject<TeTaskButton>;
    run: React.RefObject<TeTaskButton>;
    stop: React.RefObject<TeTaskButton>;
};

interface ReactState
{
    pinned?: boolean;
	task: ITask;
}

interface ReactProps
{
    task: ITask;
    webroot: string;
    executeCommand: (command: string, task: ITask) => void;
    log: (message: string, ...optionalParams: any[]) => void;
}


export class TeTaskControl extends React.Component<ReactProps, ReactState>
{
    private timerEl;
    private counter = 0;
    private buttons: ITeAppButtons;
    private log: (message: string, ...optionalParams: any[]) => void;
    private executeCommand: (command: string, task: ITask) => void;

    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.executeCommand = props.executeCommand;
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


    private clickFavorite = () =>  this.executeCommand("addRemoveRavorite", this.state.task);
    private clickOpen = () =>  this.executeCommand("open", this.state.task);
    private clickPause = () => this.executeCommand("pause", this.state.task);
    private clickRun = () => this.executeCommand("run", this.state.task);
    private clickStop = () => this.executeCommand("stop", this.state.task);
    private clickTerminal = () => this.executeCommand("openTerminal", this.state.task);

    // override componentDidMount = () => this.log("TeTaskControl.componentDidMount");
    // override componentWillUnmount = () => this.log("TeTaskControl.componentWillUnmount");
    // override componentDidUpdate = (props: any) => this.log("TeTaskControl.componentDidUpdate", props.task, this.state.task);


    private getPinnedIconCls = (): string  => `${(!this.state.task.pinned ? "far" : "fas")} fa-thumbtack te-monitor-control-pin`;


    private getTaskDetails = (): JSX.Element =>
    {
        const task = this.state.task;
        return (
            <span className="te-monitor-control-content-container">
                <table className="te-monitor-control-content-table">
                    <tbody>
                        <tr>
                            <td className="te-monitor-control-content-details-col0">
                                <table cellPadding="0" cellSpacing="0">
                                    <tbody>
                                        <tr>
                                            <td className="te-monitor-control-content-title">
                                                Details:
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="te-monitor-control-pin-container">
                                                <span className={this.getPinnedIconCls()} onClick={this.setPinned.bind(this)} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td className="te-monitor-control-content-details te-monitor-control-content-details-col1">
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
                            <td className="te-monitor-control-content-details te-monitor-control-content-details-col2">
                                <table>
                                    <tbody className="te-monitor-control-content-details-body">
                                        <tr>
                                            <td>
                                                Fastest Runtime
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;xx
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Average Runtime
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;xx
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Slowest Runtime
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;xx
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                First Runtime
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;xx
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Last Runtime
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
    {   //
        // Add a unique key to the top-level <div>.
        // The current way I'm handling the setState() in TeTaskControl doesnt seem to update the
        // state/display if the key is set there,butnot here. SOMething to do with TeTaskTab holding
        // on to an old state value because of the JSX.Element[] list and keys.  I'm sure there's a
        // better or a correct way to handle, but havent figured it out yet.  Look into again.
        //
        return (
            <div className="te-monitor-control-container" key={`te-id-task-inner-control-${++this.counter}`}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr className="te-monitor-control-row te-monitor-control-top-row">
                            <td className="te-monitor-control-icon-column">
                                <img className="te-monitor-control-icon-img" src={this.props.webroot + "/img/sources/" + this.state.task.source + ".svg"} />
                            </td>
                            <td className="te-monitor-control-content-column">
                                {this.getTaskDetails()}
                            </td>
                            <td className="te-monitor-control-spacer-column"></td>
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
                                name="terminal"
                                ref={this.buttons.pause}
                                hidden={!this.state.task.running}
                                clickHandler={this.clickTerminal.bind(this)}
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
                            <TeReactTaskTimer
                                ref={this.timerEl}
                                start={this.state.task.running}
                            />
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }


    setPinned = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>): void => {
        const el = e.target as HTMLSpanElement;
        this.log(`TeTaskControl.clickPinned: target=${el.className}`);
        this.state.task.pinned = !this.state.task.pinned;
        this.setState({ pinned: this.state.task.pinned });
        this.executeCommand("setPinned", this.state.task);
    };


    setTask = (task: ITask) => this.setState({ task });

}

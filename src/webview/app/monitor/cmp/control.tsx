/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeTaskButton } from "./button";
import { TeReactTaskTimer } from "./timer";
import { IIpcTask } from "../../../common/ipc";

interface ITeAppButtons {
    favorite: React.RefObject<TeTaskButton>;
    open: React.RefObject<TeTaskButton>;
    pause: React.RefObject<TeTaskButton>;
    run: React.RefObject<TeTaskButton>;
    stop: React.RefObject<TeTaskButton>;
};

interface ReactState
{
    animateChangedTimeIcons: boolean;
	task: IIpcTask;
}

interface ReactProps
{
    task: IIpcTask;
    webroot: string;
    executeCommand: (command: string, task: IIpcTask) => void;
    log: (message: string, ...optionalParams: any[]) => void;
}


export class TeTaskControl extends React.Component<ReactProps, ReactState>
{
    private timerEl;
    private counter = 0;
    private buttons: ITeAppButtons;
    private interval: NodeJS.Timeout | undefined;
    private log: (message: string, ...optionalParams: any[]) => void;
    private executeCommand: (command: string, task: IIpcTask) => void;
    private timerState = {
        hide: false,
        run: false,
        countMs: false,
        seconds: 0,
        milliseconds: 0
    };


    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.log("TeTaskControl.constructor: task=" + props.task.name);
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
            task: props.task,
            animateChangedTimeIcons: false
        };
    }


    private clickFavorite = () =>  this.executeCommand("addRemoveRavorite", this.state.task);
    private clickOpen = () =>  this.executeCommand("open", this.state.task);
    private clickPause = () => this.executeCommand("pause", this.state.task);
    private clickRun = () => this.executeCommand("run", this.state.task);
    private clickStop = () => this.executeCommand("stop", this.state.task);
    private clickTerminal = () => this.executeCommand("openTerminal", this.state.task);


    // override componentDidMount = () => this.startTimeChangeTimer();
    override componentWillUnmount = () => this.stopTimeChangeTimer();
    // override componentDidUpdate = (props: any) => this.log("TeTaskControl.componentDidUpdate", props.task, this.state.task);

    override shouldComponentUpdate(_nextProps: ReactProps, _nextState: ReactState)
    {
        // TODO - Only render when needed!!
        return true;
    }

    private formatRuntime = (runtime: number, type?: string) =>
    {
        let m = Math.floor(runtime / 1000 / 60).toString(),
            s = Math.floor(runtime / 1000 % 60).toString(),
            ms = Math.round(runtime % 1000).toString();
        if (m.length < 2) m = `0${m}`;
        if (s.length < 2) s = `0${s}`;
        if (ms.length < 2) ms = `0${ms}`;
        if (ms.length < 3) ms = `0${ms}`;
        return `${m}m : ${s}s : ${ms}ms`;
    };


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
                                            <td colSpan={2} className="te-monitor-control-content-details-task-name">
                                                {task.name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Last 7 Days
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{task.runCount.last7Days}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Last 30 Days
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{task.runCount.last30Days}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Last 90 Days
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{task.runCount.last90Days}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Total
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{task.runCount.total}
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
                                                Average
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{this.formatRuntime(task.runTime.average, "average")}
                                                {this.state.task.runTime.avgDown && this.getTimeChangedDown()}
                                                {this.state.task.runTime.avgUp && this.getTimeChangedUp()}
                                                {!this.state.task.runTime.avgUp && !this.state.task.runTime.avgDown && this.getTimeChangedNone()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Fastest
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{this.formatRuntime(task.runTime.fastest, "fastest")}
                                                {this.state.task.runTime.newFast && this.getTimeChangedFastest()}
                                                {!this.state.task.runTime.newFast && this.getTimeChangedNone()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Slowest
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{this.formatRuntime(task.runTime.slowest, "slowest")}
                                                {this.state.task.runTime.newSlow && this.getTimeChangedSlowest()}
                                                {!this.state.task.runTime.newSlow && this.getTimeChangedNone()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                First
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{this.formatRuntime(task.runTime.first)}{this.getTimeChangedNone()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Last
                                            </td>
                                            <td>
                                                &nbsp;&nbsp; : &nbsp;{this.formatRuntime(task.runTime.last)}
                                                {this.state.task.runTime.lastDown && this.getTimeChangedDown()}
                                                {this.state.task.runTime.lastUp && this.getTimeChangedUp()}
                                                {!this.state.task.runTime.lastUp && !this.state.task.runTime.lastDown && this.getTimeChangedNone()}
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


    private getChangeTimeCls = (iconCls: string, timeCls: string, animation: string, colorCls: string): string => this.state.animateChangedTimeIcons ?
        `fas fa-${iconCls} fa-${animation} ${colorCls} te-monitor-control-time-changed te-monitor-control-time-changed-${timeCls}` :
        `fas fa-${iconCls} te-monitor-control-time-changed te-monitor-control-time-changed-${timeCls}`;


    private getTimeChangedDown = (): JSX.Element =>
        <span className={this.getChangeTimeCls("arrow-down", "avg-down", "bounce", "te-color-ok-green")} />;


    private getTimeChangedUp = (): JSX.Element =>
        <span className={this.getChangeTimeCls("arrow-up", "avg-up", "bounce", "te-color-failure-red")} />;


    private getTimeChangedFastest = (): JSX.Element  =>
        <span className={this.getChangeTimeCls("rabbit", "fastest", "beat", "te-color-favorite-yellow")} />;


    private getTimeChangedNone = (): JSX.Element =>
        <span className="fas fa-minus te-monitor-control-time-changed" />;


    private getTimeChangedSlowest = (): JSX.Element  =>
        <span className={this.getChangeTimeCls("turtle", "slowest", "beat", "te-color-failure-red")} />;


    private onTimerStateChanged = (state: any):  void => this.timerState = { ...state };


    override render()
    {   //
        // Add a unique key to the top-level <div>.
        // The current way I'm handling the setState() in TeTaskControl doesnt seem to update the
        // state/display if the key is set there,butnot here. SOMething to do with TeTaskTab holding
        // on to an old state value because of the JSX.Element[] list and keys.  I'm sure there's a
        // better or a correct way to handle, but havent figured it out yet.  Look into again.
        //
        this.log("TeTaskControl.render: task=" + this.state.task.name);
        this.timerState.run = this.state.task.running;
        return (
            <div className="te-monitor-control-container" key={`te-id-task-inner-control-${++this.counter}`}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr className="te-monitor-control-row te-monitor-control-top-row">
                            <td className="te-monitor-control-icon-column">
                                <table cellPadding={0} cellSpacing={0} width="100%">
                                    <tbody>
                                        <tr>
                                            <td align="center" className="te-monitor-control-icon-type-td">
                                                {this.state.task.definition.type}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center">
                                                <img className="te-monitor-control-icon-img" src={this.props.webroot + "/img/sources/" + this.state.task.source + ".svg"} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
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
                                state={this.timerState}
                                onTimerStateChanged={this.onTimerStateChanged.bind(this)}
                            />
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }


    setPinned = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>): void =>
    {
        const el = e.target as HTMLSpanElement;
        this.log(`TeTaskControl.clickPinned: target=${el.className}`);
        this.state.task.pinned = !this.state.task.pinned;
        this.setState({ task: { ...this.state.task }});
        this.executeCommand("setPinned", this.state.task);
    };


    setTask = (task: IIpcTask) => this.setState(state =>
    {
        this.startTimeChangeTimer();
        return { task: { ...task }, animateChangedTimeIcons: !task.running };
    });


    setTimerMode = (ms: boolean) => this.timerEl.current?.setState({ countMs: ms });


    private startTimeChangeTimer = () =>
    {
        this.stopTimeChangeTimer();
        // eslint-disable-next-line @typescript-eslint/tslint/config
        this.interval = setInterval(() =>
            this.setState({ animateChangedTimeIcons: false }), 5000);
            // this.setState({ averageDown: false, averageUp: false, newFastestTime: false, newSlowestTime: false }), 5000);
    };


    private stopTimeChangeTimer = () =>
    {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    };

}

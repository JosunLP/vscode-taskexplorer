
import React from "react";
import { IMonitorAppTimerMode } from "src/webview/common/ipc";

interface ReactState
{
    run: boolean;
    mode: IMonitorAppTimerMode;
    ms: number;
}

interface ReactSerializedState extends ReactState {}

interface ReactProps
{
    state: ReactState;
}


export class TeReactTaskTimer extends React.Component<ReactProps, ReactState, ReactSerializedState>
{
    private interval: NodeJS.Timeout | undefined;


    constructor(props: ReactProps)
    {
        super(props);
        this.state = { ...this.props.state };
    }


    override componentDidMount = () => this.startTimer();


    override componentWillUnmount = () => this.stopTimer();


    override componentDidUpdate = () => this.startTimer();


    override render = () =>
    {
        const tm = this.state.ms,
              tmM = Math.floor(tm / 1000 / 60),
              tmS = Math.floor(tm / 1000 % 60),
              tmSF = tmS >= 10 ? tmS + "" : "0" + tmS,
              tmMS = tm % 1000,
              tmMSF = tmMS >= 100 ? tmMS + "" : (tmMS > 10 ? "0" + tmMS : "00" + tmMS),
              tmF = `${tmM}:${tmSF}${this.state.mode.startsWith("MM:SS:MS") ? "." + (this.state.mode === "MM:SS:MSS" ? tmMSF : tmMSF.slice(0, -1)) : ""}`;
        return (
            <td className="te-monitor-control-timer-column">
                <table cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td hidden={this.state.mode === "Hide"} className="te-monitor-control-timer-inner-column">
                                <span className="te-monitor-control-timer">{tmF}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        );
    };


    private startTimer = () =>
    {
        this.stopTimer();
        if (this.state.run) {
            // eslint-disable-next-line @typescript-eslint/tslint/config
            this.interval = setInterval(
                () => this.tick(), this.state.mode === "MM:SS" ? 1000 : (this.state.mode === "MM:SS:MS" ? 37 : /* MM:SS:MSS */27)
            );
        }
    };


    private stopTimer = () =>
    {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    };


    private tick = () => this.setState(state => this.state.mode !== "MM:SS:MS" ? { ms: state.ms + 1000 } : { ms: state.ms + 27 });
}

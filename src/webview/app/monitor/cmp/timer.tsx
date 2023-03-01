
import React from "react";

interface ReactState
{
    hide: boolean;
    run: boolean;
    countMs: boolean;
    seconds: number;
    milliseconds: number;
}

interface ReactProps
{
    state: ReactState;
}


export class TeReactTaskTimer extends React.Component<ReactProps, ReactState>
{
    private interval: NodeJS.Timeout | undefined;

    constructor(props: ReactProps)
    {
        super(props);
        this.state = { ...this.props.state };
    }


    override componentDidMount = () => this.startTimer();
    override componentWillUnmount = () => this.stopTimer();
    override componentDidUpdate = (_props: any) =>
    {
        this.stopTimer();
        this.startTimer();
    };


    override render = () =>
    {
        const tm = this.state.seconds,
              tmM = Math.floor(tm / 60),
              tmS = Math.floor(tm % 60),
              tmSF = tmS >= 10 ? tmS : "0" + tmS,
              tmMS = this.state.milliseconds % 1000,
              tmMSF = this.state.countMs ? "." + tmMS : "", // (tmMS >= 10 ? tmMS : "0" + tmMS) : "",
              tmF = `${tmM}:${tmSF}${tmMSF}`;
        return (
            <td className="te-monitor-control-timer-column">
                <table cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td hidden={this.state.hide} className="te-monitor-control-timer-inner-column">
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
        if (this.state.run) {
            // eslint-disable-next-line @typescript-eslint/tslint/config
            this.interval = setInterval(() => this.tick(), !this.state.countMs ? 1000 : 100);
        }
    };


    private stopTimer = () =>
    {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    };


    private tick = () => this.setState(state =>
        (!state.countMs ? { seconds: state.seconds + 1, milliseconds: 0 } :
                          { seconds: state.seconds + 0.1, milliseconds: state.milliseconds + 100 }));

}

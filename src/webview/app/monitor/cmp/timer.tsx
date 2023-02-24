
import React from "react";

interface ReactState
{
    run: boolean;
    seconds: number;
}

interface ReactProps
{
    start?: boolean;
}


export class TeReactTaskTimer extends React.Component<ReactProps, ReactState>
{
    private interval: NodeJS.Timeout | undefined;

    constructor(props: ReactProps)
    {
        super(props);
        this.state = {
            run: !!props.start,
            seconds: 0
        };
    }


    private clickHide = () =>
    {
        console.log("clickHide");
    };


    private clickShow = () =>
    {
        console.log("clickShow");
    };


    private clickShowMs = () =>
    {
        console.log("clickShowMs");
    };


    override componentDidMount = () => this.startTimer();


    override componentWillUnmount = () => this.stopTimer();


    override componentDidUpdate = (_props: any) =>
    {
        this.stopTimer();
        this.startTimer();
    };


    override render()
    {
        const tm = this.state?.seconds || 0,
              tmM = Math.floor(tm / 60),
              tmS = Math.floor(tm % 60),
              tmF = `${tmM}:${tmS >= 10 ? tmS : "0" + tmS}`;
        return (
            <td className="te-monitor-control-timer-column">
                <table cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td>
                                <span className="te-monitor-control-timer">{tmF}</span>
                            </td>
                            <td className="te-monitor-control-timer-buttons">
                                <div onClick={() => this.clickShow()} className="te-monitor-control-timer-button-show">&lt;</div>
                                <div onClick={() => this.clickShowMs()} className="te-monitor-control-timer-button-show-ms">&lt;&lt;</div>
                                <div onClick={() => this.clickHide()} className="te-monitor-control-timer-button-hide">&gt;</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        );
    }

    private startTimer = () =>
    {
        if (this.state.run) {
            // eslint-disable-next-line @typescript-eslint/tslint/config
            this.interval = setInterval(() => this.tick(), 1000);
        }
    };

    private stopTimer = () =>
    {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    };


    private tick = () => this.setState(state => ({ seconds: state.seconds + 1 }));

}

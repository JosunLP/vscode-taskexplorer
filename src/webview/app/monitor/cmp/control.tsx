
import React, { createElement, useEffect, useMemo, useRef, useState } from "react";
import { InternalNotificationType, IpcNotificationType, ITask, StateChangedCallback } from "../../../common/ipc";
import { ReactProps } from "../../common/react";
import { TeReactTaskTimer } from "./timer";


interface State
{
    seconds: number;
	tasks: ITask[];
    webroot: string;
}


export class TeTaskControl extends React.Component<ReactProps, State>
{
    private id: string | undefined;
    private callback?: StateChangedCallback;
    private counter = 0;

    constructor(props: ReactProps)
    {
        super(props);
        this.id = props.id;
        this.state = props.state;
        this.callback = props.subscribe;

        // const controlRef = useRef<TeTaskControl>(null);

        // // const [subscription, setSubscription] = useState<Subscription | undefined>(state.subscription);
	    // // const [ context, setContext ] = useState(props.state.context);
        // // const [ isLoading, setIsLoading ] = useState(props.state.loading);

        // const updateState = (
        //     state: State,
        //     type?: IpcNotificationType<any> | InternalNotificationType
        // ) => {};

        // useEffect(() => props.subscribe?.(updateState), []);

        // useEffect(() => {
        //     window.addEventListener("keydown", this.handleKeyDown);

        //     return () => {
        //         window.removeEventListener("keydown", this.handleKeyDown);
        //     };
        // }, [ null ]);
    }


    override componentDidMount()
    {
        // eslint-disable-next-line @typescript-eslint/tslint/config
        // this.interval = setInterval(() => this.tick(), 1000);
    }


    override componentWillUnmount()
    {
        // clearInterval(this.interval as NodeJS.Timeout);
    }


    handleKeyDown = (e: KeyboardEvent) =>
    {
		if (e.key === "Enter" || e.key === " ")
        {
            this.callback?.(this.state);
		}
	};


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
        this.state.tasks.forEach(t => els.push(this.createControl(t)));
        return (
            els
        );
    }

}

/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeTaskControl } from "./control";
import { ITask } from "../../../common/ipc";


interface ReactState
{
	tasks: ITask[];
}

interface ReactProps
{
    log: (message: string) => void;
    startTimer?: boolean;
    tasks: ITask[];
    webroot: string;
}


export class TeTaskTab extends React.Component<ReactProps, ReactState>
{
    private counter = 0;

    constructor(props: ReactProps)
    {
        super(props);
        this.state = {
            tasks: props.tasks
        };
    }

    override render()
    {
        const els: JSX.Element[] = [];
        this.state.tasks.forEach((t: ITask) => els.push(
            <TeTaskControl
                log={this.props.log}
                task={t}
                key={`te-id-task-control-${++this.counter}`}
                startTimer={this.props.startTimer}
                webroot={this.props.webroot}
            />
        ));
        return els;
    }
}

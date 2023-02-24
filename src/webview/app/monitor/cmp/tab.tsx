/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeTaskControl } from "./control";
import { ITask } from "../../../common/ipc";


interface ReactProps
{
    log: (message: string, ...optionalParams: any[]) => void;
    startTimer?: boolean;
    tasks: ITask[];
    webroot: string;
}


export class TeTaskTab extends React.Component<ReactProps, { tasks: ITask[] }>
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
        this.state.tasks.forEach((t: ITask) =>
        {
            this.props.log(`TeTaskTab.render: task=${t.name} source=${t.source} running=${t.running}`);
            els.push(
                <TeTaskControl
                    log={this.props.log}
                    task={t}
                    key={`te-id-task-control-${++this.counter}`}
                    startTimer={this.props.startTimer}
                    webroot={this.props.webroot}
                />
            );
        });
        return els;
    }
}

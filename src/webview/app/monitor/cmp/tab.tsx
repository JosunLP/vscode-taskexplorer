/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeTaskControl } from "./control";
import { ITask } from "../../../common/ipc";


interface ReactProps
{
    tasks: ITask[];
    webroot: string;
    executeCommand: (command: string, task: ITask) => void;
    log: (message: string, ...optionalParams: any[]) => void;
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
                    task={t}
                    log={this.props.log}
                    webroot={this.props.webroot}
                    executeCommand={this.props.executeCommand}
                    key={`te-id-task-control-${++this.counter}`}
                />
            );
        });
        return els;
    }
}

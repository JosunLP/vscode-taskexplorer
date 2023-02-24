/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeTaskControl } from "./control";
import { ITask } from "../../../common/ipc";

interface ControlRefs
{
    [id: string]: React.RefObject<TeTaskControl>;
}

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
    private children: JSX.Element[];
    private controlRefs: ControlRefs;

    constructor(props: ReactProps)
    {
        super(props);
        this.children = [];
        this.controlRefs = {};
        this.state = {
            tasks: props.tasks
        };
    }


    override render()
    {
        this.controlRefs = {};
        this.children.splice(0);
        this.state.tasks.forEach((t: ITask) =>
        {
            this.props.log(`TeTaskTab.render: task=${t.name} source=${t.source} running=${t.running}`);
            this.controlRefs[t.treeId] = React.createRef<TeTaskControl>();
            this.children.push(
                <TeTaskControl
                    task={t}
                    ref={this.controlRefs[t.treeId]}
                    log={this.props.log}
                    webroot={this.props.webroot}
                    executeCommand={this.props.executeCommand}
                />
            );
        });
        return this.children;
    }

    setTask = (task: ITask) =>
    {
        const r  = this.controlRefs[task.treeId];
        if (r) {
            const t  = this.state.tasks.findIndex(t => t.treeId === task.treeId);
            if (t !== -1) {
                this.state.tasks.splice(t, 1, task);
            }
            r.current?.setTask(task);
        }
    };


    setTasks = (tasks: ITask[]) => this.setState({ tasks });

}

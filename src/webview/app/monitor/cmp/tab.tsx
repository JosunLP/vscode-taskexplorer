/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { TeTaskControl } from "./control";
import { IIpcTask } from "../../../common/ipc";

interface ControlRefs
{
    [id: string]: React.RefObject<TeTaskControl>;
}

interface ReactProps
{
    tasks: IIpcTask[];
    webroot: string;
    executeCommand: (command: string, task: IIpcTask) => void;
    log: (message: string, ...optionalParams: any[]) => void;
}


export class TeTaskTab extends React.Component<ReactProps, { tasks: IIpcTask[] }>
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
        this.state.tasks.forEach((t: IIpcTask) =>
        {
            this.props.log(`TeTaskTab.render: task=${t.name} source=${t.source} running=${t.running}`);
            this.controlRefs[t.treeId] = React.createRef<TeTaskControl>();
            this.children.push(
                <TeTaskControl
                    task={t}
                    log={this.props.log}
                    webroot={this.props.webroot}
                    ref={this.controlRefs[t.treeId]}
                    executeCommand={this.props.executeCommand}
                    key={`te-id-task-control-${++this.counter}`}
                />
            );
        });
        return this.children;
    }


    setTask = (task: IIpcTask, isRunningTab?: boolean) =>
    {
        if (isRunningTab !== true)
        {
            const r  = this.controlRefs[task.treeId];
            if (r) {
                const t  = this.state.tasks.findIndex(t => t.treeId === task.treeId);
                if (t !== -1) {
                    this.state.tasks.splice(t, 1, task);
                }
                // React.Children.forEach(this.children, c => {
                //     if (c.props.task.treeId === task.treeId) {
                //         // console.log("RESET KEY)");
                //         // c.key = `te-id-task-control-${++this.counter}`;
                //         // Object.assign(c.props, { task: { ...task }});
                //     }
                // });
                r.current?.setTask(task);
            }
        }
        else // if (isRunningTab === true)
        {
            if (task.running)
            {
                this.state.tasks.push(task);
                this.setState({tasks: [ ...this.state.tasks ]});
            }
            else {
                const tIdx = this.state.tasks.findIndex(t => task.treeId === t.treeId);
                if (tIdx !== -1) {
                    this.state.tasks.splice(tIdx, 1);
                    this.setState({tasks: [ ...this.state.tasks ]});
                }
            }
        }
    };


    setTasks = (tasks: IIpcTask[]) => this.setState({ tasks });

}

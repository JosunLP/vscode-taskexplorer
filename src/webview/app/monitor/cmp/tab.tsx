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
            //
            // TODO - Correct use of `key` property on a list
            // Docs say'key' should be defined here on each TeTaskControl i.e.:
            //     key={`te-id-task-control-${++this.counter}`}
            // But the current way I'm handling the setState() in TeTaskControl doesnt seem to update
            // the state if the key is set here.  Works ok when the key is set on the top-level <div>
            // in TeTaskControl.  but must not be correct, docs say it explicitly.  Look into sometime.
            //
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

    setTask = (task: ITask) =>
    {
        const r  = this.controlRefs[task.treeId];
        if (r) {
            const t  = this.state.tasks.findIndex(t => t.treeId === task.treeId);
            if (t !== -1) {
                this.state.tasks.splice(t, 1, task);
            }
            React.Children.forEach(this.children, c => {
                if (c.props.task.treeId === task.treeId) {
                    // console.log("RESET KEY)");
                    // c.key = `te-id-task-control-${++this.counter}`;
                    // Object.assign(c.props, { task: { ...task }});
                }
            });
            r.current?.setTask.call(r.current, task);
        }
    };


    setTasks = (tasks: ITask[]) => this.setState({ tasks });

}

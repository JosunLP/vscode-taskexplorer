/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";
import { ITeTask, IMonitorAppTimerMode } from ":types";
import { TeTaskControl } from "./control";

interface ControlRefs
{
    [id: string]: React.RefObject<TeTaskControl>;
}

interface ReactProps
{
    name: string;
    tasks: ITeTask[];
    webroot: string;
    timerMode: IMonitorAppTimerMode;
    executeCommand: (command: string, task: ITeTask) => void;
    log: (message: string, level: number, ...args: any[]) => void;
}

interface ReactState { tasks: ITeTask[] }

interface ReactSnapShot extends ReactState {}


export class TeTaskTab extends React.Component<ReactProps, ReactState, ReactSnapShot>
{
    private name: string;
    private counter = 0;
    private rendered = false;
    private children: JSX.Element[];
    private controlRefs: ControlRefs;
    private log: (message: string, level: number, ...args: any[]) => void;


    constructor(props: ReactProps)
    {
        super(props);
        this.name = props.name;
        this.log = props.log;
        this.log(`TeTaskTab.${this.name}.constructor: task count=${props.tasks.length}`, 1);
        this.children = [];
        this.controlRefs = {};
        this.state = {
            tasks: props.tasks
        };
    }


    private getChildren = () =>
    {
        this.controlRefs = {};
        this.children.splice(0);
        this.state.tasks.forEach((t: ITeTask) =>
        {
            const ref = this.controlRefs[t.treeId] = React.createRef<TeTaskControl>();
            this.children.push(
                <TeTaskControl
                    task={t}
                    log={this.props.log}
                    webroot={this.props.webroot}
                    ref={ref}
                    timerMode={this.props.timerMode}
                    executeCommand={this.props.executeCommand}
                />
            );
        });
        return this.children;
    };


    override render()
    {
        this.rendered = true;
        this.log(`TeTaskTab.${this.name}.render: task count=${this.state.tasks.length}`, 1);
        return (
            <div className="te-tab-container">
                {this.getChildren()}
            </div>
        );
    }


    setTask = (task: ITeTask) =>
    {
        this.log(`TeTaskTab.${this.name}.setTask: id=${task.treeId}`, 1);
        if (this.name !== "running")
        {
            const r  = this.controlRefs[task.treeId];
            if (r) {
                const t  = this.state.tasks.findIndex(t => t.treeId === task.treeId);
                if (t !== -1) {
                    this.state.tasks.splice(t, 1, { ...task  });
                }
                // React.Children.forEach(this.children, c => {
                //     if (c.props.task.treeId === task.treeId) {
                //         // console.log("RESET KEY)");
                //         // c.key = `te-id-task-control-${++this.counter}`;
                //         // Object.assign(c.props, { task: { ...task }});z
                //     }
                // });
                this.log(`   TeTaskTab.${this.name}.setTask.controlRef.setTask`, 1);
                r.current?.setTask(task);
            }
        }
        else
        {
            this.log(`   TeTaskTab.${this.name}.setTask.updateRunningTasks`, 1);
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


    setTasks = (tasks: ITeTask[]) => this.setState({ tasks });


    override shouldComponentUpdate = (nextProps: ReactProps, nextState: ReactState) =>
        !this.rendered || nextState.tasks.length !== this.state.tasks.length || nextProps.timerMode !== this.props.timerMode;

}

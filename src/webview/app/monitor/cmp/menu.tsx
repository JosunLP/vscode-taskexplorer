/* eslint-disable @typescript-eslint/naming-convention */

import React, { FocusEventHandler, MouseEventHandler } from "react";
import { IMonitorAppTimerMode } from "src/webview/common/ipc";

interface ReactState
{
    timerMode: IMonitorAppTimerMode;
}

interface ReactSerializedState extends ReactState {}

interface ReactProps
{
    menuVisibility: boolean;
    timerMode: IMonitorAppTimerMode;
    handleMouseDown: MouseEventHandler<HTMLElement>;
    log: (message: string, ...optionalParams: any[]) => void;
    updateConfig: (key: string, value?: any) => void;
}


export class AppMenu extends React.Component<ReactProps, ReactState, ReactSerializedState>
{
    private log: (message: string, ...optionalParams: any[]) => void;


    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.log(`AppMenu.constructor: timerMode=${props.timerMode}`);
        this.state = {
            timerMode: props.timerMode
        };
    }


    private getMenuItemIconCls = (mode: IMonitorAppTimerMode) =>
    {
        if (this.props.timerMode === mode) {
            return "far fa-chevron-double-right te-monitor-flyout-menu-section-item-icon";
        }
        return "far fa-chevron-right te-monitor-flyout-menu-section-item-icon";
    };


    private getTimerModeItem = (mode: IMonitorAppTimerMode) =>
    {
        return (
            <tr>
                <td className="te-monitor-flyout-menu-section-item-td">
                    <span className={this.getMenuItemIconCls(mode)} />
                    <span className="te-monitor-flyout-menu-section-item"
                          onMouseDown={this.oMenuItemMouseDown}
                          onClick={(e) => this.onTimerModeClick(mode, e)}>
                        {mode}
                    </span>
                </td>
            </tr>
        );
    };


    private getTimerModeSection = () =>
    {
        return (
            <table><tbody>
                <tr>
                    <td className="te-monitor-flyout-menu-section">
                        Timer Mode
                    </td>
                </tr>
                <tr>
                    <td>
                        <table className="te-monitor-flyout-menu-section-item-table">
                            <tbody>
                                {this.getTimerModeItem("Hide")}
                                {this.getTimerModeItem("MM:SS")}
                                {this.getTimerModeItem("MM:SS:MS")}
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody></table>
        );
    };


    private getTitleHeader = () =>
    {
        return (
            <table><tbody>
                <tr>
                    <td className="te-monitor-flyout-menu-title-td">
                        <span className="far fa-gears te-title te-monitor-flyout-menu-title-icon" />
                    </td>
                    <td className="te-monitor-flyout-menu-title-td">
                        <span className="te-title te-monitor-flyout-menu-title">Task Explorer</span>
                    </td>
                </tr>
            </tbody></table>
        );
    };


    private onTimerModeClick = (mode: IMonitorAppTimerMode, e: React.MouseEvent<HTMLElement, MouseEvent>) =>
    {
        this.log(`AppMenu.onTimerModeClick: ${mode}: current mode=${this.state.timerMode}`);
        if (mode !== this.state.timerMode) {
            this.props.updateConfig("timerMode", mode);
        }
        this.props.handleMouseDown(e);
    };


    private oMenuItemMouseDown = (e: React.MouseEvent<HTMLElement, MouseEvent>) => e.stopPropagation();


    override render()
    {
        const cls = this.props.menuVisibility ? "show" : "hide";
        this.log(`AppMenu.render: menuVisibility=${this.props.menuVisibility}`);
        return (
            <div id="te-monitor-flyout-menu-id" onMouseDown={this.props.handleMouseDown} className={cls}>
                {this.getTitleHeader()}
                {this.getTimerModeSection()}
            </div>
        );
    }


    setTimerMode = (mode: IMonitorAppTimerMode) => this.setState({ timerMode: mode });

}

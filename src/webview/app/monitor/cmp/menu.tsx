/* eslint-disable @typescript-eslint/naming-convention */

import React, { MouseEventHandler } from "react";

interface ReactProps
{
    handleMouseDown: MouseEventHandler<HTMLDivElement>;
    menuVisibility: boolean;
}

export class AppMenu extends React.Component<ReactProps>
{
    constructor(props: ReactProps)
    {
        super(props);
    }

    override render()
    {
        const cls = this.props.menuVisibility ? "show" : "hide";
        return (
            <div id="te-monitor-flyout-menu-id" onMouseDown={this.props.handleMouseDown} className={cls}>
                <table>
                    <tbody>
                        <tr>
                            <td className="te-monitor-flyout-menu-title-td">
                                <span className="te-title far fa-gears" /> &nbsp;
                                <span className="te-title te-monitor-flyout-menu-title">Task Explorer</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table>
                    <tbody>
                        <tr>
                            <td className="te-monitor-flyout-menu-section">
                                Timer Mode
                            </td>
                        </tr>
                        <tr>
                            <table className="te-monitor-flyout-menu-section-items">
                                <tbody>
                                    <tr>
                                        <td className="te-monitor-flyout-menu-section-item-td">
                                            <span className="far fa-chevron-right" /> <span className="te-monitor-flyout-menu-section-item">Hide</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="te-monitor-flyout-menu-section-item-td">
                                            <span className="far fa-chevron-right" /> <span className="te-monitor-flyout-menu-section-item">MM:SS</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="te-monitor-flyout-menu-section-item-td">
                                            <span className="far fa-chevron-right" /> <span className="te-monitor-flyout-menu-section-item">MM:SS:MS</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    setTimerMode = () =>
    {

    };
}

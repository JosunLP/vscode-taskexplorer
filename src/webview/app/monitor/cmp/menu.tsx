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
        return (
            <div id="te-monitor-id-flyout-menu"
                 onMouseDown={this.props.handleMouseDown}
                 className={this.props.menuVisibility ? "show" : "hide"}>
                <h2><a href="#">Home</a></h2>
                <h2><a href="#">About</a></h2>
                <h2><a href="#">Contact</a></h2>
                <h2><a href="#">Search</a></h2>
            </div>
        );
    }
}

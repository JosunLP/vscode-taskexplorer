/* eslint-disable @typescript-eslint/naming-convention */

import React, { MouseEventHandler } from "react";

interface ReactProps
{
    handleMouseDown: MouseEventHandler<HTMLButtonElement>;
}


export class AppMenuButton extends React.Component<ReactProps>
{
    constructor(props: ReactProps)
    {
        super(props);
        this.state = {};
    }

    override shouldComponentUpdate = (nextProps: ReactProps, _nextState: any) => this.props.handleMouseDown !== nextProps.handleMouseDown;


    override render()
    {
        return (
            <span className="te-monitor-menu-button-container">
                <button
                    onMouseDown={this.props.handleMouseDown}
                    className="far fa-bars te-monitor-menu-button"
                />
            </span>
        );
    }
}

/* eslint-disable @typescript-eslint/naming-convention */

import React from "react";

interface ReactProps
{
    clickHandler: () => void;
    hidden?: boolean;
    lastButton?: boolean;
    name: string;
}


export class TeTaskButton extends React.Component<ReactProps, { hidden: boolean}>
{
    constructor(props: ReactProps)
    {
        super(props);
        this.state = {
            hidden: !!props.hidden
        };
    }

    override render()
    {
        return (
            <td className={`te-monitor-control-button-column${this.props.lastButton ? " te-monitor-control-button-column-last" : ""}`} hidden={this.state.hidden}>
                <button
                    hidden={this.state.hidden}
                    onClick={this.props.clickHandler}
                    className={`te-monitor-control-button-${this.props.name} te-monitor-control-button${this.props.lastButton ? " te-monitor-control-button-button-last" : ""}`}
                />
            </td>
        );
    }
}

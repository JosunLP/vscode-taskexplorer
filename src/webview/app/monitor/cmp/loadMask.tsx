
import React from "react";

interface ReactProps
{
    maskVisibility: boolean;
    log: (message: string, level: number, ...args: any[]) => void;
}


export class AppLoadMask extends React.Component<ReactProps>
{
    private log: (message: string, level: number, ...args: any[]) => void;

    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.log(`AppLoadMask.constructor: maskVisibility=${props.maskVisibility}`, 1);
        this.state = {};
    }

    override render()
    {
        const cls = this.props.maskVisibility ? "show" : "hide";
        this.log(`AppLoadMask.render: cls=${cls}`, 1);
        return (
            <div id="te-monitor-load-mask-id" className={cls}>
                <div className="te-tab-container-loading-container">
                    <span className="far fa-gear fa-spin te-tab-container-loading" />
                </div>
            </div>
        );
    }
}


import React from "react";

interface ReactProps
{
    maskVisibility: boolean;
    log: (message: string, ...optionalParams: any[]) => void;
}


export class AppLoadMask extends React.Component<ReactProps>
{
    private log: (message: string, ...optionalParams: any[]) => void;

    constructor(props: ReactProps)
    {
        super(props);
        this.log = props.log;
        this.log(`AppLoadMask.constructor: visibility=${props.maskVisibility}`);
        this.state = {};
    }

    override render()
    {
        const cls = this.props.maskVisibility ? "show" : "hide";
        this.log(`AppLoadMask.render: visibility=${this.props.maskVisibility}`);
        return (
            <div id="te-monitor-load-mask-id" className={cls}>
                <div>
                    <span className="far fa-sync fa-spin te-tab-container-loading" />
                </div>
            </div>
        );
    }
}

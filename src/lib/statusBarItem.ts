
import { Disposable, StatusBarAlignment, StatusBarItem, window } from "vscode";


/**
 * @class TeStatusBar
 * @since 3.0.0
 */
export class TeStatusBar implements Disposable
{
    private hidden = true;
    private statusBarNumChars = 65;
    private statusBarItem: StatusBarItem;


    constructor()
    {
        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -10000);
        this.statusBarItem.tooltip = "Task Explorer Status";
    }


    dispose = () => this.statusBarItem.dispose();


    //
    // TODO - Add an optional 'with progress' window when displaying status
    //
	// await window.withProgress(
	// {
	// 	location: ProgressLocation.Window,
	// 	cancellable: false,
	// 	title: "ExtJs"
	// },
	// async (progress) => _run(progress));

    // private updateProgress = async(action: string, pct: number) =>
    // {
    //     (this.progress as Progress<{ message: string }>).report({
    //         message: `: Parsing ${action} ${pct}%`
    //     });
    //     await utils.sleep(1); // let progress update
    // };


    get = () => this.statusBarItem.text;


    hide = () => { if (!this.hidden) { this.statusBarItem.hide(); this.hidden = true; }};


    show = () => { if (this.hidden) { this.statusBarItem.show(); this.hidden = false; }};


    // tooltip = (msg: string) => this.statusBarItem.tooltip = msg;


    update = (msg: string) =>
    {
        if (!msg)  {
            msg = "";
            this.statusBarItem.hide();
        }
        else {
            this.statusBarItem.show();
        }
        this.statusBarItem.text = this.getStatusString(msg);
    };


    private getStatusString = (msg: string) =>
    {
        if (msg.length < this.statusBarNumChars)
        {
            for (let i = msg.length; i < this.statusBarNumChars; i++) {
                msg += " ";
            }
        }
        else {
            msg = msg.substring(0, this.statusBarNumChars - 3) + "...";
        }
        return "$(loading~spin) " + msg;
    };

}


import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./parsing-report.css";

import { TeWebviewApp } from "../webviewApp";
import { IpcExecCommand, IIpcMessage, State } from "../../common/ipc";


export class ParsingReportWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("ParsingReportWebviewApp");
	}


	protected override onDataActionClicked(_e: MouseEvent, target: HTMLElement)
    {
		const action = target.dataset.action;
		if (action) {
			this.sendCommand(IpcExecCommand, { command: action.slice(8) });
		}
	}


	protected override onMessageReceived(e: MessageEvent)
    {
		const msg = e.data as IIpcMessage;
        this.log(`${this.appName}.onMessageReceived(${msg.id}): method=${msg.method}: name=${e.data.command}`, 1);
		const message = e.data; // JSON data from tests
        switch (message.command)
        {
            case "purchaseLicense":
                this.purchaseLicense();
                break;
            case "extendTrial":
                this.extendTrial();
                break;
            case "showLicensePage":
                this.showLicensePage();
                break;
            case "showReleaseNotes":
                this.showReleaseNotes();
                break;
        }
	}

    private purchaseLicense = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.purchaseLicense"});
    private extendTrial = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.extendTrial"});
    private showReleaseNotes = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.releaseNotes.show"});
    private showLicensePage = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.licensePage.show"});
}

new ParsingReportWebviewApp();

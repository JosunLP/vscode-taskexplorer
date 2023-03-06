
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./license.css";

import { TeWebviewApp } from "../webviewApp";
import { IpcExecCommand, IIpcMessage, State } from "../../common/ipc";


export class LicenseWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("LicenseWebviewApp");
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
            case "enterLicense":
                this.enterLicense();
                break;
            case "extendTrial":
                this.extendTrial();
                break;
            case "showParsingReport":
                this.showParsingReport();
                break;
            case "showReleaseNotes":
                this.showReleaseNotes();
                break;
        }
	}

	private enterLicense = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.enterLicense"});
    private extendTrial = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.extendTrial"});
    private showReleaseNotes = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.releaseNotes.show"});
    private showParsingReport = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.parsingReport.show"});
}

new LicenseWebviewApp();

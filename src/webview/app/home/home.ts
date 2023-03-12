
import "../common/css/vscode.css";
import "./home.css";
import "./home.scss";

import { Disposable } from "vscode";
import { TeWebviewApp } from "../webviewApp";
import { IpcExecCommand, State } from "../../common/ipc";


export class HomeWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("HomeWebviewApp");
	}


	protected override onInitialize()
    {
	}


	protected override onDataActionClicked(_e: MouseEvent, target: HTMLElement)
    {
		const action = target.dataset.action;
		if (action) {
			this.sendCommand(IpcExecCommand, { command: action.slice(8) });
		}
	}


    protected override onInitialized()
    {
		const disposables: Disposable[] = [];
		return disposables;
    }


	protected override onMessageReceived(e: MessageEvent)
    {
		const msg = e.data;
        this.log(`${this.appName}.onMessageReceived(${msg.id}): method=${msg.method}: name=${e.data.command}`, 1);
        switch (msg.command)
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
            case "showParsingReport":
                this.showParsingReport();
                break;
            case "showReleaseNotes":
                this.showReleaseNotes();
                break;
        }
	}

    private purchaseLicense = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.purchaseLicense"});
    private extendTrial = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.extendTrial"});
    private showReleaseNotes = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.releaseNotes.show"});
    private showParsingReport = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.parsingReport.show"});
    private showLicensePage = () => this.sendCommand(IpcExecCommand, { command: "taskexplorer.view.licensePage.show"});
}


new HomeWebviewApp();

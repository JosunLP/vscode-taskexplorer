
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./release-notes.css";

import { State } from "../../common/state";
import { TeWebviewApp } from "../webviewApp";
import { Disposable, DOM } from "../common/dom";
import { ExecuteCommandType } from "../../common/ipc";
// import { provideVSCodeDesignSystem, vsCodeButton } from "@vscode/webview-ui-toolkit";


export class ReleaseNotesWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("ReleaseNotesWebviewApp");
	}


	protected override onInitialize()
    {
		// provideVSCodeDesignSystem().register(vsCodeButton());
	}


    protected override onBind(): Disposable[]
    {
		const disposables = super.onBind?.() ?? [];
		disposables.push(
			DOM.on("[id=btnToggleReleaseNotes]", "click", (_e: MouseEvent, element: HTMLElement) => this.toggle(element)),
		);
		return disposables;
    }


	protected override onDataActionClicked(_e: MouseEvent, target: HTMLElement)
    {
		const action = target.dataset.action;
		if (action) {
			this.sendCommand(ExecuteCommandType, { command: action.slice(8) });
		}
	}


	private toggle = (element: HTMLElement) =>
	{
		const x = document.getElementById("releaseNotesDiv") as HTMLElement;
		const showing = x.classList.toggle("is-show");
		element.classList.remove(!showing ? "fa-circle-chevron-down" : "fa-circle-chevron-up");
		element.classList.add(!showing ? "fa-circle-chevron-up" : "fa-circle-chevron-down");
	};

}


new ReleaseNotesWebviewApp();

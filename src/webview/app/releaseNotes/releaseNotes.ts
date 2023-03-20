
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./release-notes.css";

import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";
import { Disposable, DOM } from "../common/dom";


export class ReleaseNotesWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("ReleaseNotesWebviewApp");
	}


    protected override onBind(): Disposable[]
    {
		return [
			DOM.on("[id=btnToggleReleaseNotes]", "click", (_e: MouseEvent, el: HTMLElement) => this.toggleFullReleaseNotes(el)),
		];
    }


	private toggleFullReleaseNotes = (element: HTMLElement) =>
	{
		const x = document.getElementById("releaseNotesDiv") as HTMLElement,
			  showing = x.classList.toggle("is-show");
		element.classList.remove(!showing ? "fa-chevron-circle-down" : "fa-chevron-circle-up");
		element.classList.add(!showing ? "fa-chevron-circle-up" : "fa-chevron-circle-down");
	};

}


new ReleaseNotesWebviewApp();


import "../common/css/vscode.css";
import "../common/css/view.css";
import "./task-count.css";

import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";


export class TaskCountWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("TaskCountWebviewApp");
	}

	//
	// TODO - Add clickactions on icons
	//
	// protected override onDataActionClicked(_e: MouseEvent, target: HTMLElement)
    // {
	// 	// const action = target.dataset.action;
	// 	super.onDataActionClicked(e, target);
	// }
}


new TaskCountWebviewApp();

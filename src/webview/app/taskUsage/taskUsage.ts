
import "../common/css/vscode.css";
import "../common/css/view.css";
import "./task-usage.css";

import { State } from ":types";
import { TeWebviewApp } from "../webviewApp";


export class TaskUsageWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("TaskUsageWebviewApp");
	}
}

new TaskUsageWebviewApp();

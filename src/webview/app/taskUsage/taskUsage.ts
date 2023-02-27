
import "../common/css/vscode.css";
import "./task-usage.css";

import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";


export class TaskUsageWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("TaskUsageWebviewApp");
	}
}

new TaskUsageWebviewApp();

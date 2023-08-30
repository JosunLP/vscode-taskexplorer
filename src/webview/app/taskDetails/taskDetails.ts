
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./task-details.css";

import { State } from ":types";
import { TeWebviewApp } from "../webviewApp";


export class TaskDetailsWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("TaskDetailsWebviewApp");
	}
}

new TaskDetailsWebviewApp();

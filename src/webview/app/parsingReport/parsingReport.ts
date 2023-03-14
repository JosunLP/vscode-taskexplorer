
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./parsing-report.css";

import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";

export class ParsingReportWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("ParsingReportWebviewApp");
	}
}

new ParsingReportWebviewApp();

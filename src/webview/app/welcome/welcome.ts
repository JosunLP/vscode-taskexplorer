
import "../common/css/vscode.css";
import "../common/css/page.css";
import "../common/scss/page.scss";
import "./welcome.css";

import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";


export class WelcomeWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("WelcomeWebviewApp");
	}
}

new WelcomeWebviewApp();

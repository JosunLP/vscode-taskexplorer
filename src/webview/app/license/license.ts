
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
}

new LicenseWebviewApp();

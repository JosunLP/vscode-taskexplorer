
import "../common/css/vscode.css";
import "../common/css/view.css";
import "./home.css";
import "./home.scss";

import { Disposable } from "vscode";
import { State } from "../../common/ipc";
import { TeWebviewApp } from "../webviewApp";

export class HomeWebviewApp extends TeWebviewApp<State>
{
	constructor()
    {
		super("HomeWebviewApp");
	}

	protected override onInitialize()
    {
	}

    protected override onInitialized()
    {
		const disposables: Disposable[] = [];
		return disposables;
    }
}

new HomeWebviewApp();

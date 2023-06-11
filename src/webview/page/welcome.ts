
import type { State } from "../common/ipc";
import { WebviewIds  } from "../../interface";
import { TeWebviewPanel } from "../webviewPanel";
import type { TeWrapper } from "../../lib/wrapper";
import { createTaskImageTable } from "../common/taskImageTable";


export class WelcomePage extends TeWebviewPanel<State>
{
	static viewId: WebviewIds = "welcome";


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			`${WelcomePage.viewId}.html`,
			`${wrapper.extensionTitle} Tutorial`,
			WelcomePage.viewId,
			"res/img/logo-bl.png",
			wrapper.keys.Commands.ShowWelcomePage
		);
		this._ignoreTeBusy = true;
	}


	protected override includeBootstrap = (): State => this.getState();


	protected override onHtmlPreview = async(html: string): Promise<string> => html.replace("#{taskImageTable}", createTaskImageTable());

}


import type { State } from "../common/ipc";
import { WebviewIds  } from "../../interface";
import { TeWebviewPanel } from "../webviewPanel";
import type { TeWrapper } from "../../lib/wrapper";
import { createTaskImageTable } from "../common/taskImageTable";


export class WelcomePage extends TeWebviewPanel<State>
{
	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper, "welcome.html", `${wrapper.extensionTitle} Tutorial`,
			"welcome", "res/img/logo-bl.png", wrapper.keys.Commands.ShowWelcomePage
		);
		this._ignoreTeBusy = true;
	}


	protected override includeBootstrap = (): State => this.getState();


	protected override onHtmlPreview = async(html: string): Promise<string> => html.replace("#{taskImageTable}", createTaskImageTable());

}

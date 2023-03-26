
import type { State } from "../common/ipc";
import { TeWebviewPanel } from "../webviewPanel";
import type { TeWrapper } from "../../lib/wrapper";
import { Commands } from "../../lib/command/command";
import { ContextKeys, WebviewIds  } from "../../lib/context";
import { createTaskImageTable } from "../common/taskImageTable";


export class WelcomePage extends TeWebviewPanel<State>
{
	static viewTitle = "Task Explorer Tutorial";
	static viewId: WebviewIds = "welcome";


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			`${WelcomePage.viewId}.html`,
			WelcomePage.viewTitle.replace("#{version}", wrapper.context.extension.packageJSON.version),
			"res/img/logo-bl.png",
			`taskexplorer.view.${WelcomePage.viewId}`,
			`${ContextKeys.WebviewPrefix}${WelcomePage.viewId}`,
			WelcomePage.viewId,
			Commands.ShowWelcomePage
		);
		this._ignoreTeBusy = true;
	}


	protected override includeBootstrap = (): State => this.getState();


	protected override onHtmlPreview = async(html: string): Promise<string> => html.replace("#{taskImageTable}", createTaskImageTable());

}

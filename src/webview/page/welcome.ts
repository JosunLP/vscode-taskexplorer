
import type { State } from "../common/ipc";
import { TeWebviewPanel } from "../webviewPanel";
import type { TeWrapper } from "../../lib/wrapper";
import { Commands } from "../../lib/command/command";
import { ContextKeys, WebviewIds  } from "../../lib/context";


export class WelcomePage extends TeWebviewPanel<State>
{
	static viewTitle = "Task Explorer Walkthrough";
	static viewId: WebviewIds = "welcome";


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"welcome.html",
			WelcomePage.viewTitle.replace("#{version}", wrapper.context.extension.packageJSON.version),
			"res/img/logo-bl.png",
			`taskexplorer.view.${WelcomePage.viewId}`,
			`${ContextKeys.WebviewPrefix}welcome`,
			"welcome",
			Commands.ShowWelcomePage
		);
	}


	protected override includeBootstrap = (): Promise<State> => this.getState();

}

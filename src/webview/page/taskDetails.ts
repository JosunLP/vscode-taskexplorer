
import type { IIpcTask, State } from "../common/ipc";
import { TeWebviewPanel } from "../webviewPanel";
import type { TeWrapper } from "../../lib/wrapper";
import { Commands } from "../../lib/command/command";
import { ContextKeys, WebviewIds  } from "../../lib/context";


export class TaskDetailsPage extends TeWebviewPanel<State>
{
	static viewTitle = "Task Explorer Walkthrough";
	static viewId: WebviewIds = "taskDetails";


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"task-details.html",
			TaskDetailsPage.viewTitle.replace("#{version}", wrapper.context.extension.packageJSON.version),
			"res/img/logo-bl.png",
			`taskexplorer.view.${TaskDetailsPage.viewId}`,
			`${ContextKeys.WebviewPrefix}taskDetails`,
			"taskDetails",
			Commands.ShowTaskDetailsPage
		);
	}


	protected override includeBootstrap = (): Promise<State> => this.getState();


    protected override includeBody = async(...args: any[]) =>
    {
        const iTask = args[0] as IIpcTask;
        // TODO - Display task details
		return iTask.name;
    };


	protected override includeHead = async() => "";
	protected override includeEndOfBody = async() => "";

}

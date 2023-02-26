
import { State } from "../common/state";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { ITeTaskChangeEvent } from "../../interface";
import { createTaskCountTable } from "../common/taskCountTable";
import { ContextKeys, WebviewViewIds } from "../../lib/context";


export class TaskCountView extends TeWebviewView<State>
{
	static viewTitle = "Task Count";
	static viewDescription = "Task Counts by Type";
	static viewId: WebviewViewIds = "taskCount"; // Must match view id in package.jso


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			TaskCountView.viewTitle,
			TaskCountView.viewDescription,
			"task-count.html",
			`taskexplorer.view.${TaskCountView.viewId}`,
			`${ContextKeys.WebviewViewPrefix}home`,
			`${TaskCountView.viewId}View`
		);
		this.disposables.push(
			wrapper.treeManager.onDidTaskCountChange(e => this.onTaskCountChanged(e), this)
		);
	}


	protected override includeBody = async() => createTaskCountTable(this.wrapper);
	protected override includeHead = async() => "";
	protected override includeEndOfBody = async() => "";
	protected override includeBootstrap = (): Promise<State> => this.getState();


	private async onTaskCountChanged(_e: ITeTaskChangeEvent)
	{
		if (this.isFirstLoadComplete) {
			await this.refresh();
		}
	}

}

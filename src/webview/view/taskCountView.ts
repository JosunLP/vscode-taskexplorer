
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { ITeTaskChangeEvent } from "../../interface";
import { debounceCommand } from "../../lib/command/command";
import { createTaskCountTable } from "../common/taskCountTable";
import { ContextKeys, WebviewViewIds } from "../../lib/context";


export class TaskCountView extends TeWebviewView<State>
{
	static viewId: WebviewViewIds = "taskCount"; // Must match view id in package.jso


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"Task Count",
			"Task Counts by Type",
			"task-count.html",
			`taskexplorer.view.${TaskCountView.viewId}`,
			`${ContextKeys.WebviewViewPrefix}${TaskCountView.viewId}`,
			`${TaskCountView.viewId}View`
		);
	}


	protected override includeBody = () => createTaskCountTable(this.wrapper);


	protected override includeHead = () => ""; // cover empty string in Base.getHtml()


	protected override includeEndOfBody = () => ""; // cover empty string in Base.getHtml()


	protected override includeBootstrap = (): State => this.getState();


	protected override onInitializing()
	{
		return  [
			this.wrapper.treeManager.onDidTaskCountChange(this.onTaskCountChanged, this)
		];
	}


	private onTaskCountChanged = (_e: ITeTaskChangeEvent): void => debounceCommand("taskCountView.event.onTaskCountChanged", this.refresh, 75, this);

}

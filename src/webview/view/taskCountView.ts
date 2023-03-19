
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { debounce } from "../../lib/command/command";
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
	}


	protected override includeBody = async() => createTaskCountTable(this.wrapper);


	protected override includeHead = async() => ""; // cover empty string in Base.getHtml()


	protected override includeEndOfBody = async() => ""; // cover empty string in Base.getHtml()


	protected override includeBootstrap = (): Promise<State> => this.getState();


	protected override onInitializing()
	{
		return  [
			this.wrapper.treeManager.onDidTaskCountChange(this.onTaskCountChanged, this)
		];
	}


	private onTaskCountChanged = (_e: ITeTaskChangeEvent): void => debounce("taskCountView.event.onTaskCountChanged", this.refresh, 75, this);

}


import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { StorageProps } from "../../lib/constants";
import { StorageChangeEvent } from "../../interface";
import { ContextKeys, WebviewViewIds } from "../../lib/context";


export class TaskUsageView extends TeWebviewView<State>
{
	static viewTitle = "Task Usage";
	static viewDescription = "Task Usage Details";
	static viewId: WebviewViewIds = "taskUsage"; // Must match view id in package.jso


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			TaskUsageView.viewTitle,
			TaskUsageView.viewDescription,
			"task-usage.html",
			`taskexplorer.view.${TaskUsageView.viewId}`,
			`${ContextKeys.WebviewViewPrefix}home`,
			`${TaskUsageView.viewId}View`
		);
		this.disposables.push(
			wrapper.storage.onDidChange(e => { this.onStorageChanged(e); }, this)
		);
	}


	protected override includeBody = async() => ""; // For coverage, empty body
	protected override includeHead = async() => ""; // For coverage, empty head
	protected override includeEndOfBody = async() => "<!-- spm -->"; // For coverage, endOfBody and no bootstrap


	private async onStorageChanged(e: StorageChangeEvent)
	{
		if (e.key === StorageProps.Usage || e.key === StorageProps.TaskUsage)
		{
			this.wrapper.log.methodStart("TaskUsageView Event: onStorageChanged", 2, this.wrapper.log.getLogPad());
			await this.refresh();
			this.wrapper.log.methodDone("TaskUsageView Event: onStorageChanged", 2, this.wrapper.log.getLogPad());
		}
	}


	protected override onHtmlFinalize = async (html: string) =>
	{
    	const lastTime = this.wrapper.usage.getLastRanTaskTime(),
			  mostUsedTask = this.wrapper.usage.mostUsedTask;
		html = html.replace(/\#\{taskUsage\.avgPerDay\}/g, this.wrapper.usage.getAvgRunCount("d", "").toString())
				   .replace(/\#\{taskUsage\.avgPerWeek\}/g, this.wrapper.usage.getAvgRunCount("w", "").toString())
				   .replace(/\#\{taskUsage\.mostUsedTask\}/g, this.wrapper.utils.textWithElipsis(mostUsedTask.name, 26))
				   .replace(/\#\{taskUsage\.today\}/g, this.wrapper.usage.getTodayCount("").toString())
				   .replace(/\#\{taskUsage\.lastTaskRanAt\}/g, lastTime);
		return html;
	};

}

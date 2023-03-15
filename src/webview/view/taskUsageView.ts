
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { ConfigKeys, StorageKeys } from "../../lib/constants";
import { StorageChangeEvent } from "../../interface";
import { ContextKeys, WebviewViewIds } from "../../lib/context";
import { ConfigurationChangeEvent } from "vscode";


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
	}


	protected override includeBody = async() => ""; // For coverage, empty body
	protected override includeHead = async() => ""; // For coverage, empty head
	protected override includeEndOfBody = async() => "<!-- spm -->"; // For coverage, endOfBody and no bootstrap


	protected override async onConfigChanged(e: ConfigurationChangeEvent)
	{
		if (this.wrapper.config.affectsConfiguration(e, ConfigKeys.TrackUsage, ConfigKeys.TaskMonitor.TrackStats))
		{
			this.wrapper.log.methodOnce("task usage view event", "onConfigChanged", 2, this.wrapper.log.getLogPad());
			await this.refresh();
		}
		await super.onConfigChanged(e);
	}


	protected override onInitializing()
	{
		return  [
			this.wrapper.storage.onDidChange(this.onStorageChanged, this)
		];
	}


	private async onStorageChanged(e: StorageChangeEvent)
	{
		if (e.key === StorageKeys.Usage || e.key === StorageKeys.TaskUsage)
		{
			this.wrapper.log.methodOnce("task usage view event", "onStorageChanged", 2, this.wrapper.log.getLogPad());
			await this.refresh();
		}
	}


	protected override onHtmlFinalize = async (html: string) =>
	{
		const trackStats = this.wrapper.config.get<boolean>(ConfigKeys.TrackUsage) &&
						   this.wrapper.config.get<boolean>(ConfigKeys.TaskMonitor.TrackStats);
		if (trackStats)
		{
			const lastTime = this.wrapper.usage.getLastRanTaskTime(),
				  mostUsedTask = this.wrapper.usage.mostUsedTask;
			html = html.replace(/\#\{taskUsage\.avgPerDay\}/g, this.wrapper.usage.getAvgRunCount("d", "").toString())
					   .replace(/\#\{taskUsage\.avgPerWeek\}/g, this.wrapper.usage.getAvgRunCount("w", "").toString())
					   .replace(/\#\{taskUsage\.mostUsedTask\}/g, this.wrapper.utils.textWithElipsis(mostUsedTask.name, 26))
					   .replace(/\#\{taskUsage\.today\}/g, this.wrapper.usage.getTodayCount("").toString())
					   .replace(/\#\{taskUsage\.lastTaskRanAt\}/g, lastTime);
		}
		else {
			html = "<center><br /><br />Task stat tracking is disabled</center>";
		}
		return html;
	};

}

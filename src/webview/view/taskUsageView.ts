
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { ConfigurationChangeEvent } from "vscode";
import { debounce } from "../../lib/command/command";
import { ITeUsageChangeEvent, StorageChangeEvent } from "../../interface";
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
	}


	protected override includeBody = async() => ""; // For coverage, empty body


	protected override includeHead = async() => ""; // For coverage, empty head


	protected override includeEndOfBody = async() => "<!-- spm -->"; // For coverage, endOfBody and no bootstrap


	protected override onConfigChanged(e: ConfigurationChangeEvent)
	{
		if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.TrackUsage, this.wrapper.keys.Config.TaskMonitor.TrackStats))
		{
			debounce("taskUsageView.event.onConfigChanged", this.refresh, 75, false, false);
		}
		super.onConfigChanged(e);
	}


	protected override onHtmlFinalize = async (html: string) =>
	{
		const trackStats = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TrackUsage) &&
						   this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TaskMonitor.TrackStats);
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


	protected override onInitializing()
	{
		return  [
			this.wrapper.usage.onDidChange(this.onUsageChanged, this)
		];
	}


	private onUsageChanged(e: ITeUsageChangeEvent | undefined): void
	{
		if (e && e.key === "task:")
		{
			this.wrapper.log.methodOnce("task usage view event", "onUsageChanged", 2, this.wrapper.log.getLogPad());
			void this.refresh(false, false);
		}
	}

}

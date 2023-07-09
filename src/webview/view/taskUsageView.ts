
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { ConfigurationChangeEvent } from "vscode";
import { debounceCommand } from "../../lib/command/command";
import { ITeUsageChangeEvent, WebviewViewIds } from "../../interface";


export class TaskUsageView extends TeWebviewView<State>
{
	static viewId: WebviewViewIds = "taskUsage"; // Must match view id in package.jso
	private _trackStats = false;
	private _trackUsage = false;


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"Task Usage",
			"Task Usage Details",
			"task-usage.html",
			TaskUsageView.viewId
		);
		this._trackUsage = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TrackUsage, false);
		this._trackStats = this._trackUsage && this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TaskMonitorTrackStats, false);
	}


	protected override includeBody = () => ""; // For coverage, empty body


	protected override includeHead = () => ""; // For coverage, empty head


	protected override includeEndOfBody = () => { if (!this._trackUsage) { return "<center><br /><br />Task stat tracking is disabled</center>"; } return ""; };


	protected override onConfigChanged(e: ConfigurationChangeEvent)
	{
		if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.TrackUsage, this.wrapper.keys.Config.TaskMonitorTrackStats))
		{
			this._trackUsage = this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TrackUsage, false);
			this._trackStats = this._trackUsage && this.wrapper.config.get<boolean>(this.wrapper.keys.Config.TaskMonitorTrackStats, false);
			void debounceCommand("taskUsageView.event.onConfigChanged", this.refresh, 75, this, false, false);
		}
		super.onConfigChanged(e);
	}


	protected override onHtmlFinalize = async (html: string) =>
	{
		if (this._trackStats)
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
			const statsStartIdx = html.indexOf("<table"),
				  statsEndIdx = html.lastIndexOf("</table>") + 8;
			html = (html.substring(0, statsStartIdx) + html.substring(statsEndIdx));
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
		if (e && e.key.startsWith("task:"))
		{
			this.wrapper.log.methodEvent("task usage view event", "onUsageChanged", 2);
			void this.refresh(false, false);
		}
	}

}

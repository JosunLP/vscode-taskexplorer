
import { dirname } from "path";
import type { State } from "../common/ipc";
import { TeWebviewPanel } from "../webviewPanel";
import { ConfigurationChangeEvent } from "vscode";
import type { TeWrapper } from "../../lib/wrapper";
import { debounce } from "../../lib/command/command";
import { ContextKeys, WebviewIds  } from "../../lib/context";
import { ITeTask, ITeTaskStatusChangeEvent } from "../../interface";


export class TaskDetailsPage extends TeWebviewPanel<State>
{
	static viewTitle = "Task Details - #{task_name}";
	static viewId: WebviewIds = "taskDetails";

	private _task: ITeTask;


	constructor(wrapper: TeWrapper, task: ITeTask)
	{
		super(
			wrapper,
			"task-details.html",
			TaskDetailsPage.viewTitle.replace("#{task_name}", task.name),
			"res/img/logo-bl.png",
			`taskexplorer.view.${TaskDetailsPage.viewId}`,
			`${ContextKeys.WebviewPrefix}taskDetails`,
			"taskDetails"
		);
		this._task = { ...task };
	}


	private formatRuntime = (runtime: number) =>
    {
		const _pad = (d: string) => (d.length < 2) ? `0${d}` : d;
        const m = Math.floor(runtime / 1000 / 60).toString(),
            s = Math.floor(runtime / 1000 % 60).toString();
        let ms = Math.round(runtime % 1000).toString();
        ms = _pad(ms);
		/* istanbul ignore next */
        if (ms.length < 3) ms = `0${ms}`;
        return `${_pad(m)}m : ${_pad(s)}s : ${ms}ms`;
    };


	private getIcon = (task: ITeTask): string => `#{webroot}/img/sources/${task.source}.svg`;


	private getPath = (task: ITeTask): string => !task.definition.scriptFile ? task.fsPath : dirname(task.fsPath);


    protected override includeBody = (task: ITeTask) =>
    {
		let html = `<div class=\"te-task-details-container\"><table align=\"center\" width=\"900\"<tr><td>
					<table class="te-task-details-header-table" width="100%"><tbody><tr>
					<td class="te-task-details-header-td te-task-details-header-title-td">
						<table cellpadding="0" cellspacing="0"><tbody>
						<tr>
							<td valign="top" class="te-task-details-header-title-icon-td"><img class="te-task-details-header-title-icon" src="${this.getIcon(task)}"></td>
							<td valign="top" class="te-task-details-header-title-name-td">${task.name}</td>
						</tr>
						<tr>
							<td colspan="2" class="te-task-details-header-title-location">Location: ${this.getPath(task)}</td>
						</tr>
						</tbody></table>
					</td>`;
        const usage = this.wrapper.usage.get("task:" + task.treeId);
		if (usage && usage.taskStats &&  usage.taskStats.runtimes && usage.taskStats.runtimes.length > 0)
		{
			html += `<td class="te-task-details-header-td te-task-details-header-details-td" align="right">
						<table width="100%"><tbody>
							<tr>
								<td class="te-task-details-header-details-icon-td">
									<span class="fas fa-rabbit te-color-rabbit-pink" />
								</td>
								<td class="te-task-details-header-details-time-td">
									${this.formatRuntime(usage.taskStats.fastest)}
								</td>
							</tr>
							<tr>
								<td class="te-task-details-header-details-icon-td">
									<span class="fas fa-turtle te-color-turtle-green" />
								</td>
								<td class="te-task-details-header-details-time-td">
									${this.formatRuntime(usage.taskStats.slowest)}
								</td>
							</tr>
						</tbody></table>
					</td>
					</tr></tbody></table>`;

			html += `<table width="100%"><tbody>
						<tr class=\"te-task-details-runtimes-header\">
						<td>Start</td><td>End</td><td>Run Time</td>
						</tr>`;

			for (const r of usage.taskStats.runtimes.filter(r => r.start && r.end))
			{
				html += `<tr class="te-task-details-runtimes-row">
							<td>${this.wrapper.utils.formatDate(r.start)}</td>
							<td>${this.wrapper.utils.formatDate(r.end)}</td>
							<td>${this.formatRuntime(r.time)}</td>
						</tr>`;
			}

			html += "</tbody></table>";
		}
		else
		{
			html += `<td class="te-task-details-header-td te-task-details-header-details-td" align="right">
						No tracked statistics available
					</td></tr></tbody></table>`;
		}

		html += "</td></tr></table></div>";
		return html;
    };


	protected override includeFontAwesome = () => ({ solid: true, icons: [ "rabbit", "turtle" ] });


	protected override onConfigChanged(e: ConfigurationChangeEvent)
	{
		if (this.wrapper.config.affectsConfiguration(e, this.wrapper.keys.Config.TrackUsage, this.wrapper.keys.Config.TaskMonitor.TrackStats))
		{
			debounce("taskDetailsCfg:", this.refresh, 75, false, false);
		}
		super.onConfigChanged(e);
	}


	protected override onInitializing()
	{
		return  [
			this.wrapper.taskWatcher.onDidTaskStatusChange(this.onTaskStatusChanged, this)
		];
	}


    private onTaskStatusChanged = (e: ITeTaskStatusChangeEvent): void =>
	{
		if (e.task.treeId === this._task.treeId && !e.task.running) {
			this._task = { ...e.task };
			void this.refresh(false, false, this._task);
		}
	};


	override show = () => super.show(undefined, this._task);

}

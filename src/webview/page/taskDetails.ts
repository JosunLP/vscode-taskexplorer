
import type { State } from "../common/ipc";
import { TeWebviewPanel } from "../webviewPanel";
import type { TeWrapper } from "../../lib/wrapper";
import { ContextKeys, WebviewIds  } from "../../lib/context";
import { ITeTask, ITeTaskStatusChangeEvent } from "../../interface";
import { dirname, join } from "path";


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
		this.disposables.push(
			wrapper.taskWatcher.onDidTaskStatusChange(this.onTaskStatusChanged, this)
		);
	}


	private formatRuntime = (runtime: number) =>
    {
        let m = Math.floor(runtime / 1000 / 60).toString(),
            s = Math.floor(runtime / 1000 % 60).toString(),
            ms = Math.round(runtime % 1000).toString();
        if (m.length < 2) m = `0${m}`;
        if (s.length < 2) s = `0${s}`;
        if (ms.length < 2) ms = `0${ms}`;
        if (ms.length < 3) ms = `0${ms}`;
        return `${m}m : ${s}s : ${ms}ms`;
    };


	private  getPath = (task: ITeTask): string => !task.definition.scriptFile ? task.fsPath : dirname(task.fsPath);


    protected override includeBody = async(task: ITeTask) =>
    {
		let html = "<div class=\"te-task-details-container\"><table align=\"center\" width=\"900\"<tr><td>";
        const usage = this.wrapper.usage.get("task:" + task.treeId);
		if (usage)
		{
			if (usage.taskStats &&  usage.taskStats.runtimes && usage.taskStats.runtimes.length > 0)
			{
				html += `<table class="te-task-details-header-table" width="100%"><tbody><tr>
							<td class="te-task-details-header-td te-task-details-header-title-td">
								<div class="te-task-details-header-title-name">${task.name}</div>
								<div class="te-task-details-header-title-location">Location: ${this.getPath(task)}</div>
							</td>
							<td class="te-task-details-header-td te-task-details-header-details-td" align="right">
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
				for (const r of usage.taskStats.runtimes)
				{
					html += `<tr class="te-task-details-runtimes-row">
								<td>${this.wrapper.utils.formatDate(r.start)}</td>
								<td>${this.wrapper.utils.formatDate(r.end)}</td>
								<td>${this.formatRuntime(r.time)}</td>
							</tr>`;
				}
				html += "</tbody></table>";
			}
			else {
				html += `<center><table><tbody>
							<tr><td class="te-task-details-title">${task.name}</td></tr>
							<tr><td>No runtime statistics available</td></tr>
						</tbody></table></center>`;
			}
		}
		else {
			html += `<center><table><tbody>
						<tr><td class="te-task-details-title">${task.name}</td></tr>
						<tr><td>No tracked usage available</td></tr>
					</tbody></table></center>`;
		}
		html += "</td></tr></table></div>";
		return html;
    };


	protected override includeFontAwesome = () => ({ solid: true, icons: [ "rabbit", "turtle" ] });


    private onTaskStatusChanged = async (e: ITeTaskStatusChangeEvent) =>
	{
		if (e.task.treeId === this._task.treeId && !e.task.running) {
			this._task = { ...e.task };
			await this.refresh();
		}
	};


	override show = () => super.show(undefined, this._task);

}

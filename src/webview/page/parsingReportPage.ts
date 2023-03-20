
import { Task, Uri } from "vscode";
import { State } from "../common/ipc";
import { dirname, relative } from "path";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { ITeTaskChangeEvent } from "../../interface";
import { Commands, debounce } from "../../lib/command/command";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { isWorkspaceFolder } from "../../lib/utils/typeUtils";
import { createTaskCountTable } from "../common/taskCountTable";
import { getWorkspaceProjectName, pushIfNotExists } from "../../lib/utils/utils";
import { createTaskImageTable } from "../common/taskImageTable";


export class ParsingReportPage extends TeWebviewPanel<State>
{
	static viewTitle = "Task Explorer Parsing Report";
	static viewId: WebviewIds = "parsingReport";


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"parsing-report.html",
			ParsingReportPage.viewTitle,
			"res/img/logo-bl.png",
			`taskexplorer.view.${ParsingReportPage.viewId}`,
			`${ContextKeys.WebviewPrefix}parsingReport`,
			"parsingReportPage",
			Commands.ShowParsingReportPage
		);
	}


	private getExtraContent = (uri?: Uri) =>
	{
		let project = uri ? getWorkspaceProjectName(uri.fsPath || uri.path) : undefined;

		let details = `<table class="margin-top-15" width="97%" align="center">
		<tr class="content-section-header">
			<td class="content-section-header-nowrap" nowrap>Source</td>
			<td class="content-section-header-nowrap" nowrap>Name</td>
			<td class="content-section-header-nowrap" nowrap>Project</td>
			<td class="content-section-header-nowrap" nowrap>Default</td>
			<td class="content-section-header-nowrap" nowrap>Provider</td>
			<td class="content-section-header-nowrap" nowrap>File</td>
		</tr><tr><td colspan="6"><hr></td></tr>`;

		const projects: string[] = [],
			  tasks = this.wrapper.treeManager.getTasks();

		tasks.forEach((t: Task) =>
		{
			let wsFolder;
			/* istanbul ignore else */
			if (isWorkspaceFolder(t.scope))
			{
				wsFolder = t.scope;
				project = getWorkspaceProjectName(wsFolder.uri.fsPath);
			}
			else {
				project = "User";
			}

			let filePath: string;
			if (wsFolder)
			{
				if (t.definition.uri)
				{
					filePath = relative(dirname(wsFolder.uri.fsPath), t.definition.uri.fsPath);
				}
				else {
					filePath = relative(dirname(wsFolder.uri.fsPath), t.name);
				}
			}
			else {
				filePath = "N/A";
			}

			details += `
		<tr class="content-text-small">
			<td valign="top" class="content-section-subheader" nowrap>${t.source}</td>
			<td valign="top" class="content-section-header-nowrap" nowrap>${t.name}</td>
			<td valign="top" class="content-section-header-nowrap" nowrap>${project}</td>
			<td valign="top" class="content-section-header-nowrap" nowrap>${t.definition.isDefault || "N/A"}</td>
			<td valign="top" class="content-section-header-nowrap" nowrap>${t.source}</td>
			<td valign="top" class="content-section-header-nowrap" nowrap>${filePath}</td>
		</tr>
		<tr><td height="10"></td></tr>`;

			if (wsFolder) {
				pushIfNotExists(projects, wsFolder.name);
			}
			else {
				pushIfNotExists(projects, "+ User Tasks");
			}
		});

		details += "</table>";

		const summary = `<table><tr><td class="parsing-report-projects-title">Projects:</td><td class="parsing-report-projects">${projects.join(", &nbsp;")}</td></tr></table>`;

		return `<tr><td><table class="margin-top-15"><tr><td>${summary}</td></tr></table><table><tr><td>${details}</td></tr></table></td></tr>`;
	};


	protected override onHtmlPreview = async(html: string, ...args: any[]) =>
	{
		const uri = args[0] as Uri | undefined;
		const project = uri ? getWorkspaceProjectName(uri.fsPath || uri.path) : undefined;
		html = createTaskCountTable(this.wrapper, project, html);
		html = html.replace("#{parsingReportTable}", this.getExtraContent(uri));
		html = html.replace("#{taskImageTable}", createTaskImageTable());
		return html;
	};


	protected override onInitializing()
	{
		return  [
			this.wrapper.treeManager.onDidAllTasksChange(this.onTasksChanged, this)
		];
	}


	private onTasksChanged = (_e: ITeTaskChangeEvent): void => debounce("parsigReport.event.onTasksChanged", this.refresh, 75, this);

}

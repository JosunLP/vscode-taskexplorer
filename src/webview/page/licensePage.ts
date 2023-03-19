
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { ITeTaskChangeEvent } from "../../interface";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { Commands, debounce } from "../../lib/command/command";
import { createTaskCountTable } from "../common/taskCountTable";


export class LicensePage extends TeWebviewPanel<State>
{
	static viewTitle = "Task Explorer Licensing";
	static viewId: WebviewIds = "licensePage";


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"license.html",
			LicensePage.viewTitle,
			"res/img/logo-bl.png",
			`taskexplorer.view.${LicensePage.viewId}`,
			`${ContextKeys.WebviewPrefix}licensePage`,
			"licensePage",
			Commands.ShowLicensePage
		);
	}


	private getExtraContent = async () =>
	{
		const licMgr = this.wrapper.licenseManager;
		const key = licMgr.account.license.key;
		const details =  // !newKey ?
	(!licMgr.isLicensed ? `
	<table class="margin-top-15">
		<tr><td class="content-subsection-header">
			Licensing Note
		</td></tr>
		<tr><td>
			This extension is free to use but am considering a small license for an
			unlimited parsed component type of thing (e.g $10 - $20), as the time spent
			and functionality have went way beyond what was at first intended.
		</td></tr>
	</table>
	<table class="margin-top-20">
		<tr><td>You can view a detailed parsing report using the "<i>${this.wrapper.extensionName}: View Parsing Report</i>"
		command in the Explorer context menu for any project.  It can alternatively be ran from the
		command pallette for "all projects".
		<tr><td height="20"></td></tr>
	</table>
	` : `
	<table class="margin-top-15">
		<tr><td class="content-subsection-header te-licmgr-subsection-header">${!licMgr.isTrial ? "License" : "Trial"} Key: &nbsp;${key}</td></tr>
		<tr><td>
			${!licMgr.isTrial ? "Thank you for supporting Task Explorer!" : `Purchase a license today to support ${this.wrapper.extensionName} development!`}
		</td></tr>
	</table>
	<table class="margin-top-20">
		<tr><td>You can view a detailed parsing report using the "<i>${this.wrapper.extensionName}: View Parsing Report</i>"
		command in the Explorer context menu for any project.  It can alternatively be ran from the
		command pallette for "all projects" to see how many tasks the extension has parsed.
		<tr><td height="20"></td></tr>
	</table>
	`);
		return `<tr><td>${details}</td></tr>`;
	};


	private getExtraContent2 = () =>
	{;
		const details = `<tr><td>
	<table class="margin-top-15">
		<tr><td class="content-section-header">Example Parsing Report:</td></tr>
		<tr><td>
			<img src="#{webroot}/readme/parsingreport.png">
		</td></tr>
	</td></tr>`;
		return `<tr><td>${details}</td></tr>`;
	};


	protected override onHtmlPreview = async (html: string) =>
	{
		html = await createTaskCountTable(this.wrapper, undefined, html);
		let infoContent = await this.getExtraContent();
		html = html.replace("#{licensePageBodyTop}", infoContent);
		infoContent = this.getExtraContent2();
		html = html.replace("#{licensePageBodyBottom}", infoContent);
		return html;
	};


	protected override onInitializing()
	{
		return  [
			this.wrapper.treeManager.onDidAllTasksChange(this.onTasksChanged, this)
		];
	}


	private onTasksChanged = (_e: ITeTaskChangeEvent): void => debounce("licensePage.event.onTasksChanged", this.refresh, 75, this);

}

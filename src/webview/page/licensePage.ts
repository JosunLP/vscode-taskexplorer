
import { Disposable } from "vscode";
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { ITeTaskChangeEvent } from "../../interface";
import { ContextKeys, WebviewIds } from "../../lib/context";
import { Commands, debounce } from "../../lib/command/command";
import { createTaskCountTable } from "../common/taskCountTable";
import { createTaskImageTable } from "../common/taskImageTable";


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


	private getLicenseStateContent = (): string =>
	{
		const licMgr = this.wrapper.licenseManager,
			  key = licMgr.account.license.key,
			  extName = this.wrapper.extensionName;

		const details = !licMgr.isLicensed ? `
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
		<tr><td>You can view a detailed parsing report using the "<i>${extName}: View Parsing Report</i>"
		command in the Explorer context menu for any project.  It can alternatively be ran from the
		command pallette for "all projects".
		<tr><td height="20"></td></tr>
	</table>
	` : `
	<table class="margin-top-15">
		<tr><td class="content-subsection-header te-licmgr-subsection-header">${!licMgr.isTrial ? "License" : "Trial"} Key: &nbsp;&nbsp;</td>
		<td class="te-licmgr-license-key-container">${key}</td>
		<td class="te-licmgr-copy-key-td">
			<div class="te-tooltip">
				<span id="copyKeySpan" class="far fa-copy te-licmgr-copy-key"></span>
				<span class="te-tooltiptext">Copy license key to system clipboard</span>
			</div>
		</td>
		</tr>
		<tr><td colspan="3" class="padding-top-10">
			${!licMgr.isTrial ? `Thank you for supporting ${extName}!` :
								`Purchase a license today to support ${extName} development!`}
		</td></tr>
	</table>
	<table class="margin-top-20">
		<tr><td>You can view a detailed parsing report using the "<i>${extName}: View Parsing Report</i>"
		command in the Explorer context menu for any project.  It can alternatively be ran from the
		command pallette for "all projects" to see how many tasks the extension has parsed.
		<tr><td height="10"></td></tr>
	</table>`;

		return `<tr><td>${details}</td></tr>`;
	};


	protected override includeFontAwesome = () => (
		{ duotone: true, regular: true, icons: [ "copy", "upload", "xmark" ] }
	);


	protected override onHtmlPreview = async (html: string): Promise<string> =>
	{
		html = createTaskCountTable(this.wrapper, undefined, html);
		html = html.replace("#{licenseStateContent}", this.getLicenseStateContent())
			       .replace("#{taskImageTable}", createTaskImageTable());
		return html;
	};


	protected override onInitializing(): Disposable[]
	{
		return  [
			this.wrapper.treeManager.onDidAllTasksChange(this.onTasksChanged, this)
		];
	}


	private onTasksChanged = (_e: ITeTaskChangeEvent): void => debounce("licensePage.event.onTasksChanged", this.refresh, 75, this);

}

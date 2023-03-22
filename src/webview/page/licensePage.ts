
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


	private populateStateContent = (html: string): string =>
	{
		const licMgr = this.wrapper.licenseManager,
			  extName = this.wrapper.extensionName,
			  isPaid = !!licMgr.account.license.paid,
			  msg = isPaid ? `Thank you for supporting ${extName}!` :
						     `Purchase a license today to support ${extName} development!`;
		html = html.replace(/#{licensePage.keyType}/g, isPaid ? "License" : "Trial")
				   .replace(/#{licensePage.key}/g, licMgr.account.license.key)
				   .replace(/#{licensePage.stateMessage}/g, msg);
		return html;
	};


	protected override includeFontAwesome = () => (
		{ duotone: true, regular: true, icons: [ "copy", "upload", "xmark" ] }
	);


	protected override onHtmlPreview = async (html: string): Promise<string> =>
	{
		html = createTaskCountTable(this.wrapper, undefined, html);
		html = this.populateStateContent(html)
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

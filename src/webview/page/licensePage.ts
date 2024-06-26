
import { Disposable } from "vscode";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";
import { ITeTaskChangeEvent } from "../../interface";
import { debounceCommand } from "../../lib/command/command";
import { createTaskCountTable } from "../common/taskCountTable";
import { createTaskImageTable } from "../common/taskImageTable";
import { IIpcMessage, IpcRegisterAccountMsg, onIpc, State } from "../common/ipc";


/* TEMP */ /* istanbul ignore next */
export class LicensePage extends TeWebviewPanel<State>
{

	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper, "license.html", `${wrapper.extensionTitle} Licensing`,
			"licensePage", "res/img/logo-bl.png", wrapper.keys.Commands.ShowLicensePage
		);
	}


	private populateStateContent = (html: string): string =>
	{
		const licMgr = this.wrapper.licenseManager,
			  extensionName = this.wrapper.extensionTitle,
			  isPaid = !!licMgr.account.license.paid,
			  msg = isPaid ? `Thank you for supporting ${extensionName}!` :
						     `Purchase a license today to support ${extensionName} development!`;
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

	protected override onMessageReceived(e: IIpcMessage): void
	{
		switch (e.method)
		{
			case IpcRegisterAccountMsg.method:
				onIpc(IpcRegisterAccountMsg, e, params => this.wrapper.licenseManager.submitRegistration(params));
				break;
			// default: // ** NOTE ** Uncomment if an onMessageReceived() method is added to TeWebviewPanel
			// 	super.onMessageReceived(e);
		}
	}


	private onTasksChanged = (_e: ITeTaskChangeEvent): void => debounceCommand("licensePage.event.onTasksChanged", this.refresh, 75, this);

}

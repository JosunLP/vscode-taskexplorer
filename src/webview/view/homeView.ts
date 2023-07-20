
import { Disposable } from "vscode";
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { registerCommand } from "../../lib/command/command";
import { ITeTaskChangeEvent, TeSessionChangeEvent } from "../../interface";


export class HomeView extends TeWebviewView<State>
{

	constructor(wrapper: TeWrapper)
	{
		super(wrapper, "Home", "Home", "home.html", "home");
	}


	protected override includeBootstrap = (): State => this.getState();


	protected override includeFontAwesome = () => ({ light: true, icons: [ "lock", "unlock", "user", "user-slash" ]});


	protected override onFocusChanged(_focused: boolean): void // covering
	{
		this.wrapper.log.methodEvent("homeview event", "focus changed", 2);
	}


	protected override onHtmlFinalize = async (html: string) =>
	{
		const isLic = this.wrapper.licenseManager.isLicensed,
			  isTrial = this.wrapper.licenseManager.isTrial,
			  isError = this.wrapper.licenseManager.isErrorState,
			  days = this.wrapper.licenseManager.statusDays;
    	html = html.replace("#{taskCounts.length}", this.wrapper.treeManager.tasks.length.toString())
				   .replace("#{taskCounts.today}", this.wrapper.usage.getTodayCount("").toString())
				   .replace("#{license.sessionIconTip}", "Session status - Not Verified")
				   .replace("#{license.statusIconTip}", "License status - " + (isError || isTrial ? "Unlocked (Trial)" : (isLic ? "Unlocked" : "Locked")))
				   .replace("#{license.sessionIconCls}", "fal fa-" + (isTrial || isError ? "user-slash" : (isLic ? "user-slash" : "user-slash")))
				   .replace("#{license.statusIconCls}", "fal fa-" + (isTrial || isError ? "unlock te-color-favorite-yellow" : (isLic ? "unlock te-color-ok-green" : "lock te-color-failure-red")))
				   .replace("#{license.status}", this.wrapper.licenseManager.statusDescription)
				   /* TEMP */ /* istanbul ignore next */.replace("#{license.statusDays}", days && !isError && (isTrial || isLic) ? ` (${days})` : "")
				   .replace("#{license.statusTip}", !isError ? (isTrial ? `${days} days left in trial` : (isLic ? `${days} days left before renewal` : "")) : "A license server error occurred, full access granted");
		return html;
	};


	protected override onInitializing()
	{
		return  [
			this.wrapper.licenseManager.onDidSessionChange(this.onSessionChanged, this),
			this.wrapper.treeManager.onDidTaskCountChange(this.onTaskCountChanged, this)
		];
	}


	private onSessionChanged(e: TeSessionChangeEvent): void
	{
		this.wrapper.log.methodEvent("homeview event", "session changed", 2);
		/* TEMP */ /* istanbul ignore next */
		if (e.changeFlags.licenseState || e.changeFlags.licenseType || e.changeFlags.trialPeriod || e.changeFlags.verification || e.changeFlags.license) {
			void this.refresh(true, false);
		}
	}


	private onTaskCountChanged = (_e: ITeTaskChangeEvent): Promise<void> => this.refresh(false, false);


	protected override onVisibilityChanged(_visible: boolean)
	{
		this.wrapper.log.methodEvent("homeview event", "visibility changed", 2);
	}


	// protected override onWindowFocusChanged(_focused: boolean)
	// {
	// 	this.wrapper.log.methodStart("HomeView Event: onWindowFocusChanged", 2, this.wrapper.log.getLogPad());
	// 	this.wrapper.log.methodDone("HomeView Event: onWindowFocusChanged", 2, this.wrapper.log.getLogPad());
	// }


	protected override registerCommands(): Disposable[]
	{
		return [
			registerCommand(this.wrapper.keys.Commands.OpenRepository,
				() => this.wrapper.utils.openUrl(`https://github.com/${this.wrapper.extensionAuthor}/${this.wrapper.extensionName}`),
			this)
		];
	}

}

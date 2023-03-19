
import { Disposable } from "vscode";
import { State } from "../common/ipc";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { Commands, debounce, registerCommand } from "../../lib/command/command";
import { ContextKeys, WebviewViewIds } from "../../lib/context";
import { ITeTaskChangeEvent, TeSessionChangeEvent } from "../../interface";

/*
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/default/weather-webview/src/webview/main.ts
import {
  provideVSCodeDesignSystem,
  Button,
  Dropdown,
  ProgressRing,
  TextField,
  vsCodeButton,
  vsCodeDropdown,
  vsCodeOption,
  vsCodeTextField,
  vsCodeProgressRing,
} from "@vscode/webview-ui-toolkit";
<vscode-button id="check-weather-button">Check</vscode-button>
          <h2>Current Weather</h2>
          <section id="results-container">
            <vscode-progress-ring id="loading" class="hidden"></vscode-progress-ring>
// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodeProgressRing(),
  vsCodeTextField()
);

// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener("load", main);

// Main function that gets executed once the webview DOM loads
function main() {
  // To get improved type annotations/IntelliSense the associated class for
  // a given toolkit component can be imported and used to type cast a reference
  // to the element (i.e. the `as Button` syntax)
  const checkWeatherButton = document.getElementById("check-weather-button") as Button;
  checkWeatherButton.addEventListener("click", checkWeather);

  setVSCodeMessageListener();
}
*/


export class HomeView extends TeWebviewView<State>
{
	static viewTitle = "Home";
	static viewDescription = "Home";
	static viewId: WebviewViewIds = "home"; // Must match view id in package.json


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			HomeView.viewTitle,
			HomeView.viewDescription,
			"home.html",
			`taskexplorer.view.${HomeView.viewId}`,
			`${ContextKeys.WebviewViewPrefix}home`,
			`${HomeView.viewId}View`
		);
	}


	protected override includeBootstrap = (): Promise<State> => this.getState();


	protected override includeFontAwesome = () => ({ light: true, icons: [ "lock", "unlock", "user", "user-slash" ]});


	protected override async onReady() // covering
	{
		this.wrapper.log.methodOnce("homeview event", "ready", 2, this.wrapper.log.getLogPad());
	}


	protected override onFocusChanged(_focused: boolean): void // covering
	{
		this.wrapper.log.methodOnce("homeview event", "focus changed", 2, this.wrapper.log.getLogPad());
	}


	protected override onHtmlFinalize = async (html: string) =>
	{
		const isLic = this.wrapper.licenseManager.isLicensed,
			  isTrial = this.wrapper.licenseManager.isTrial,
			  days = this.wrapper.licenseManager.statusDays;
    	html = html.replace("#{taskCounts.length}", this.wrapper.treeManager.getTasks().length.toString())
				   .replace("#{taskCounts.today}", this.wrapper.usage.getTodayCount("").toString())
				   .replace("#{license.sessionIconTip}", "Session status - Not Verified")
				   .replace("#{license.statusIconTip}", "License status - " + (isTrial ? "Unlocked (Trial)" : (isLic ? "Unlocked" : "Locked")))
				   .replace("#{license.sessionIconCls}", "fal fa-" + (isTrial ? "user-slash" : (isLic ? "user-slash" : "user-slash")))
				   .replace("#{license.statusIconCls}", "fal fa-" + (isTrial ? "unlock te-color-favorite-yellow" : (isLic ? "unlock te-color-ok-green" : "lock te-color-failure-red")))
				   .replace("#{license.status}", this.wrapper.licenseManager.statusDescription)
				   .replace("#{license.statusDays}", isTrial || isLic ? ` (${days})` : "")
				   .replace("#{license.statusTip}", isTrial ? `${days} days left in trial` : (isLic ? `${days} days left before renewal` : ""));
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
		this.wrapper.log.methodOnce("homeview event", "session changed", 2, this.wrapper.log.getLogPad());
		if (e.changeFlags.licenseState || e.changeFlags.licenseType || e.changeFlags.trialPeriod || e.changeFlags.verification || e.changeFlags.license) {
			void this.refresh(true, false);
		}
	}


	private onTaskCountChanged = (_e: ITeTaskChangeEvent): Promise<void> => this.refresh(false, false);


	protected override onVisibilityChanged(_visible: boolean)
	{
		this.wrapper.log.methodOnce("homeview event", "visibility changed", 2, this.wrapper.log.getLogPad());
	}


	// protected override onWindowFocusChanged(_focused: boolean)
	// {
	// 	this.wrapper.log.methodStart("HomeView Event: onWindowFocusChanged", 2, this.wrapper.log.getLogPad());
	// 	this.wrapper.log.methodDone("HomeView Event: onWindowFocusChanged", 2, this.wrapper.log.getLogPad());
	// }


	protected override registerCommands(): Disposable[]
	{
		return [
			registerCommand(Commands.OpenRepository, () => this.wrapper.utils.openUrl("https://github.com/spmeesseman/vscode-taskexplorer"), this)
		];
	}

}

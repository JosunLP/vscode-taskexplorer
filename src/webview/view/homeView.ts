
import { State } from "../common/state";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewView } from "../webviewView";
import { ITeTaskChangeEvent } from "../../interface";
import { StorageChangeEvent } from "../../interface/IStorage";
import { ConfigurationChangeEvent, Disposable } from "vscode";
import { ContextKeys, WebviewViewIds } from "../../lib/context";

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
		this.disposables.push(
			wrapper.config.onDidChange(e => { this.onConfigurationChanged(e); }, this),
			wrapper.treeManager.onDidAllTasksChange(e => { this.onTasksChanged(e); }, this)
		);
	}


	protected override includeBootstrap = (): Promise<State> => this.getState();


	protected override includeFontAwesome = () => ({ light: true, icons: [
		"lock", "unlock", "user", "user-slash", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
	]});


	private onConfigurationChanged(e: ConfigurationChangeEvent)
	{
		this.wrapper.log.methodStart("HomeView Event: onConfigurationChanged", 2, this.wrapper.log.getLogPad());
		this.wrapper.log.methodDone("HomeView Event: onConfigurationChanged", 2, this.wrapper.log.getLogPad());
	}


	private async onTasksChanged(_e: ITeTaskChangeEvent)
	{
		this.wrapper.log.methodStart("HomeView Event: onTasksChanged", 2, this.wrapper.log.getLogPad());
		if (this.isFirstLoadComplete) {
			await this.refresh();
		}
		this.wrapper.log.methodDone("HomeView Event: onTasksChanged", 2, this.wrapper.log.getLogPad());
	}


	protected override async onReady()
	{
		this.wrapper.log.methodStart("HomeView Event: onReady", 2, this.wrapper.log.getLogPad());
		this.wrapper.log.methodDone("HomeView Event: onReady", 2, this.wrapper.log.getLogPad());
	}


	protected override onFocusChanged(_focused: boolean): void
	{
		this.wrapper.log.methodStart("HomeView Event: onFocusChanged", 2, this.wrapper.log.getLogPad());
		this.wrapper.log.methodDone("HomeView Event: onFocusChanged", 2, this.wrapper.log.getLogPad());
	}


	protected override onHtmlFinalize = async (html: string) =>
	{
		const isLic = this.wrapper.licenseManager.isLicensed();
    	html = html.replace("#{taskCounts.length}", this.wrapper.treeManager.getTasks().length.toString())
				   .replace("#{taskCounts.today}", this.wrapper.taskUsageTracker.getTodayCount("").toString())
				   .replace("#{license.status}", isLic ? "LICENSED" : "UNLICENSED")
				   .replace("#{license.sessionIconCls}", "fal fa-" + (isLic ? "user-slash" : "user-slash"))
				   .replace("#{license.statusIconCls}", "fal fa-" + (isLic ? "unlock te-color-ok-green" : "lock te-color-failure-red"));
		return html;
	};


	protected override onVisibilityChanged(_visible: boolean)
	{
		this.wrapper.log.methodStart("HomeView Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad());
		this.wrapper.log.methodDone("HomeView Event: onVisibilityChanged", 2, this.wrapper.log.getLogPad());
	}


	// protected override onWindowFocusChanged(_focused: boolean)
	// {
	// 	this.wrapper.log.methodStart("HomeView Event: onWindowFocusChanged", 2, this.wrapper.log.getLogPad());
	// 	this.wrapper.log.methodDone("HomeView Event: onWindowFocusChanged", 2, this.wrapper.log.getLogPad());
	// }


	protected override registerCommands(): Disposable[]
	{
		return [];
	}


	protected override async getState()
	{
		return {
			...(await super.getState())
		};
	}

}

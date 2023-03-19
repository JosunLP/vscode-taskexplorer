/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */

import { IDictionary } from "../../interface";
import {
	Command as VsCodeCommand, Disposable, commands
} from "vscode";

type SupportedCommands = Commands | `taskexplorer.view.${string}.focus` | `taskexplorer.view.${string}.resetViewLocation`;

export const enum Commands
{
	AddToExcludes = "taskexplorer.addToExcludes",
	AddToExcludesMenu = "taskexplorer.addToExcludesEx",
	AddRemoveCustomLabel = "taskexplorer.addRemoveCustomLabel",
	AddRemoveFavorite = "taskexplorer.addRemoveFavorite",
	ClearFavorites = "taskexplorer.clearFavorites",
	ClearLastTasks = "taskexplorer.clearLastTasks",
	Donate = "taskexplorer.donate",
	DisableTaskType = "taskexplorer.disableTaskType",
	EnableTaskType = "taskexplorer.enableTaskType",
	ExtendTrial = "taskexplorer.extendTrial",
	FocusExplorerTreeView  = "taskexplorer.view.taskTreeExplorer.focus",
	FocusSidebarTreeView  = "taskexplorer.view.taskTreeSideBar.focus",
	FocusSidebarView  = "taskExplorerSideBar.focus",
	FocusHomeView  = "taskexplorer.view.home.focus",
	FocusTaskCountView  = "taskexplorer.view.taskCount.focus",
	FocusTaskUsageView  = "taskexplorer.view.taskUsage.focus",
	GetApi = "taskexplorer.getApi",
	NpmRunAudit = "taskexplorer.runAudit",
	NpmRunAuditFix = "taskexplorer.runAuditFix",
	NpmRunInstall = "taskexplorer.runInstall",
	NpmRunUpdate = "taskexplorer.runUpdate",
	NpmRunUpdatePackage = "taskexplorer.runUpdatePackage",
    Open = "taskexplorer.open",
	OpenBugReports = "taskexplorer.openBugReports",
	OpenRepository = "taskexplorer.openRepository",
	OpenSettings = "taskexplorer.openSettings",
	OpenTerminal = "taskexplorer.openTerminal",
	Pause = "taskexplorer.pause",
	PurchaseLicense = "taskexplorer.purchaseLicense",
	Refresh = "taskexplorer.refresh",
	RemoveFromExcludes = "taskexplorer.removeFromExcludes",
	RemoveHomeView = "taskexplorer.view.home.removeView",
	RemoveTaskCountView = "taskexplorer.view.taskCount.removeView",
	RemoveTaskUsageView= "taskexplorer.view.taskUsage.removeView",
	RemoveExplorerTreeView = "taskexplorer.view.taskTreeExplorer.removeView",
	RemoveSidebarTreeView = "taskexplorer.view.taskTreeSideBar.removeView",
	ResetHomeViewLocation = "taskexplorer.view.home.resetViewLocation",
	ResetTaskCountViewLocation = "taskexplorer.view.taskCount.resetViewLocation",
	ResetTaskUsageViewLocation= "taskexplorer.view.taskUsage.resetViewLocation",
	ResetExplorerTreeViewLocation = "taskexplorer.view.taskTreeExplorer.resetViewLocation",
	ResetSidebarTreeViewLocation = "taskexplorer.view.taskTreeSideBar.resetViewLocation",
	Restart = "taskexplorer.restart",
    Run = "taskexplorer.run",
    RunLastTask = "taskexplorer.runLastTask",
    RunWithArgs = "taskexplorer.runWithArgs",
	RunWithNoTerminal = "taskexplorer.runNoTerm",
	SetPinned = "taskexplorer.setPinned",
	ShowLicensePage = "taskexplorer.view.licensePage.show",
	ShowParsingReportPage = "taskexplorer.view.parsingReport.show",
	ShowReleaseNotesPage = "taskexplorer.view.releaseNotes.show",
	ShowSideBar = "workbench.view.extension.taskExplorerSideBar",
	ShowTaskDetailsPage = "taskexplorer.view.taskDetails.show",
	ShowTaskMonitorPage = "taskexplorer.view.taskMonitor.show",
	ShowWelcomePage = "taskexplorer.view.welcome.show",
	Stop = "taskexplorer.stop",
	ToggleHomeViewVisibility = "taskexplorer.view.home.toggleVisibility",
	ToggleTaskCountViewVisibility = "taskexplorer.view.taskCount.toggleVisibility",
	ToggleTaskUsageViewVisibility= "taskexplorer.view.taskUsage.toggleVisibility",
	ToggleExplorerTreeViewVisibility = "taskexplorer.view.taskTreeExplorer.toggleVisibility",
	ToggleSidebarTreeViewVisibility = "taskexplorer.view.taskTreeSideBar.toggleVisibility"
}

export const enum VsCodeCommands
{
	CloseActiveEditor = "workbench.action.closeActiveEditor",
	CloseAllEditors = "workbench.action.closeAllEditors",
	FocusFilesExplorer = "workbench.files.action.focusFilesExplorer",
	FocusSearch = "workbench.view.search.focus",
	MoveViews = "vscode.moveViews",
	Open = "vscode.open",
	OpenFolder = "vscode.openFolder",
	OpenInTerminal = "openInTerminal",
	OpenWalkthrough = "workbench.action.openWalkthrough",
	NextEditor = "workbench.action.nextEditor",
	PreviewHtml = "vscode.previewHtml",
	RevealInExplorer = "revealInExplorer",
	RevealInFileExplorer = "revealFileInOS",
	SetContext = "setContext",
	ShowExplorer = "workbench.view.explorer"
}

export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable =>
{
	return commands.registerCommand(
		command,
		function (this: any, ...args) {
			void (this.usage || this.wrapper.usage).track(`command:${command}`);
			return callback.call(this, ...args);
		},
		thisArg
	);
};


export function executeCommand<U = any>(command: SupportedCommands): Thenable<U>;
export function executeCommand<T = unknown, U = any>(command: SupportedCommands, arg: T): Thenable<U>;
export function executeCommand<T extends [...unknown[]] = [], U = any>(command: SupportedCommands, ...args: T): Thenable<U>;
export function executeCommand<T extends [...unknown[]] = [], U = any>(command: SupportedCommands, ...args: T): Thenable<U>
{   //
	// TODO - Telemetry
	//
	// this.wrapper.telemetry.sendEvent("command/taskexplorer", { command: command });
	return commands.executeCommand<U>(command, ...args);
}

const _debounceDict: IDictionary<IDebounceParams> = {};
interface IDebounceParams { fn: (...args: any[]) => any; start: number; args: any[] }

export const debounce = <T>(key: string, fn: (...args: any[]) => T, wait: number, ...args: any[]) => new Promise<T|void>(async(resolve) =>
{
	const dKey = key + fn.name;
	if (!_debounceDict[dKey])
	{
		_debounceDict[dKey] = { fn, start: Date.now(), args };
		setTimeout((p: IDebounceParams) =>
		{
			resolve(p.fn.call(this, ...p.args));
			delete _debounceDict[dKey];
		},
		wait, _debounceDict[dKey]);
	}
	else {
		Object.assign(_debounceDict[dKey], { args });
		setTimeout(() => resolve(), Date.now() - _debounceDict[dKey].start);
	}
});

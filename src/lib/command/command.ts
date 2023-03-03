/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */

import {
	Command as VsCodeCommand, Disposable, Uri, commands, Command
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
	EnterLicense = "taskexplorer.enterLicense",
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
	Refresh = "taskexplorer.refresh",
	RefreshHomeView = "taskexplorer.view.home.refresh",
	RefreshLicensePage = "taskexplorer.view.licensePage.refresh",
	RefreshParsingReportPage = "taskexplorer.view.parsingReport.refresh",
	RefreshReleaseNotesPage = "taskexplorer.view.releaseNotes.refresh",
	RefreshTaskCountView = "taskexplorer.view.taskCount.refresh",
	RefreshTaskUsageView = "taskexplorer.view.taskUsage.refresh",
	RefreshWelcomePage = "taskexplorer.view.welcome.refresh",
	Register = "taskexplorer.register",
	RemovefromExcludes = "taskexplorer.removeFromExcludes",
	Restart = "taskexplorer.restart",
    Run = "taskexplorer.run",
    RunLastTask = "taskexplorer.runLastTask",
    RunWithArgs = "taskexplorer.runWithArgs",
	RunWithNoTerminal = "taskexplorer.runNoTerm",
	SetPinned = "taskexplorer.setPinned",
	ShowLicensePage = "taskexplorer.view.licensePage.show",
	ShowParsingReportPage = "taskexplorer.view.parsingReport.show",
	ShowReleaseNotesPage = "taskexplorer.view.releaseNotes.show",
	ShowTaskDetailsPage = "taskexplorer.view.taskDetails.show",
	ShowTaskMonitorPage = "taskexplorer.view.taskMonitor.show",
	ShowWelcomePage = "taskexplorer.view.welcome.show",
	Stop = "taskexplorer.stop"
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

/* eslint-disable @typescript-eslint/naming-convention */

import { Disposable } from "vscode";
import { TreeviewIds, WebviewIds, WebviewPrefix, WebviewViewIds } from "./ITeWebview";

export const enum CommandPrefix
{
	Base = "taskexplorer.",
	View = "taskexplorer.view."
}

export enum Commands
{
	AddToExcludes = "taskexplorer.addToExcludes",
	AddToExcludesMenu = "taskexplorer.addToExcludesEx",
	AddRemoveCustomLabel = "taskexplorer.addRemoveCustomLabel",
	AddRemoveFavorite = "taskexplorer.addRemoveFavorite",
	ClearFavorites = "taskexplorer.clearFavorites",
	ClearLastTasks = "taskexplorer.clearLastTasks",
	CopyKeyToClipboard = "taskexplorer.copyKeyToClipboard",
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
	RefreshSession = "taskexplorer.refreshSession",
	Register = "taskexplorer.register",
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
	ShowOutputWindow = "taskexplorer.showOutput",
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

export enum VsCodeCommands
{
	CloseActiveEditor = "workbench.action.closeActiveEditor",
	CloseAllEditors = "workbench.action.closeAllEditors",
	FocusFilesExplorer = "workbench.files.action.focusFilesExplorer",
	FocusOutputWindowPanel = "workbench.panel.output.focus",
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

 export type SupportedCommands = Commands | VsCodeCommands |
		`${WebviewPrefix.View}${WebviewViewIds|WebviewIds|TreeviewIds}.focus` |
		`${WebviewPrefix.View}${WebviewViewIds|WebviewIds|TreeviewIds}.resetViewLocation`;

export interface ICommand
{
	debounceCommand(key: string, fn: (...args: any[]) => any, wait: number, thisArg: any, ...args: any[]): void;
	executeCommand<U = any>(command: SupportedCommands): Thenable<U>;
	executeCommand<T = unknown, U = any>(command: SupportedCommands, arg: T): Thenable<U>;
	executeCommand<T extends [...unknown[]] = [], U = any>(command: SupportedCommands, ...args: T): Thenable<U>;
    registerCommand(command: SupportedCommands, callback: (...args: any[]) => any, thisArg?: any): Disposable;
}

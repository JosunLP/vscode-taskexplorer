/* eslint-disable @typescript-eslint/naming-convention */

import { ConfigurationChangeEvent, Event } from "vscode";

export const enum ConfigPrefix
{
	Pinned = "taskexplorer.pinned.",
	SpecialFolder = "taskexplorer.specialFolder."
}

export enum ConfigKeys
{
    AllowUsageReporting = "allowUsageReporting",
    EnableExplorerTree = "enableExplorerView",
    EnabledLogging = "taskexplorer.logging.enable",
    EnableSideBar = "enableSideBar",
    EnablePersistenFileCache = "enablePersistentFileCaching",
    GroupMaxLevel = "groupMaxLevel",
    GroupSeparator = "groupSeparator",
    GroupStripTaskLabel = "groupStripTaskLabel",
    GroupWithSeperator = "groupWithSeparator",
    KeepTerminalOnTaskDone = "keepTermOnStop",
    LogLevel = "taskexplorer.logging.level",
    LogEnableOutputWindow = "taskexplorer.logging.enableOutputWindow",
    LogEnableFileSymbols = "taskexplorer.logging.enableFileSymbols",
    LogEnableFile = "taskexplorer.logging.enableFile",
    ReportGlobalUsage = "taskMonitor.reportUsage",
    SortProjectFoldersAlphabetically = "sortProjectFoldersAlpha",
    SpecialFoldersFolderState = "specialFolders.folderState",
    SpecialFoldersNumLastTasks = "specialFolders.numLastTasks",
    SpecialFoldersShowFavorites = "specialFolders.showFavorites",
    SpecialFoldersShowLastTasks = "specialFolders.showLastTasks",
    TaskButtonsClickAction = "taskButtons.clickAction",
    TaskButtonsControlCharacter = "taskButtons.controlCharacter",
    TaskMonitorTimerMode = "taskMonitor.timerMode",
    TaskMonitorTrackStats = "taskMonitor.trackStats",
    TrackUsage = "trackUsage"
};
export interface IConfiguration
{
    onDidChange: Event<ConfigurationChangeEvent>;
    affectsConfiguration(e: ConfigurationChangeEvent, ...settings: string[]): boolean;
    get<T>(key: string, defaultValue?: T): T;
    getVs<T>(key: string, defaultValue?: T): T;
    update(key: string, value: any): Thenable<void>;
    updateVs(key: string, value: any): Thenable<void>;
    updateVsWs(key: string, value: any): Thenable<void>;
    updateWs(key: string, value: any): Thenable<void>;
}

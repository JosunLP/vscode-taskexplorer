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
    EnableAnsiconForAnt = "enableAnsiconForAnt",
    EnableExplorerTree = "enableExplorerView",
    EnabledLogging = "logging.enable",
    EnableSideBar = "enableSideBar",
    EnablePersistenFileCache = "enablePersistentFileCaching",
    Environment = "environment",
    ExcludeGlobs = "exclude",
    ExcludeTaskRegexes = "excludeTask",
    GlobPatternsAnt = "globPatternsAnt",
    GlobPatternsBash = "globPatternsBash",
    GlobPatternsNode = "globPatternsNode",
    GroupMaxLevel = "groupMaxLevel",
    GroupSeparator = "groupSeparator",
    GroupStripTaskLabel = "groupStripTaskLabel",
    GroupWithSeperator = "groupWithSeparator",
    IncludeAnt = "includeAnt",
    KeepTerminalOnTaskDone = "keepTermOnStop",
    LogLevel = "logging.level",
    LogEnableOutputWindow = "logging.enableOutputWindow",
    LogEnableFileSymbols = "logging.enableFileSymbols",
    LogEnableFile = "logging.enableFile",
    PathToPrograms = "pathToPrograms",
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
    TrackUsage = "trackUsage",
    UseNpmProvider = "useNpmProvider"
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

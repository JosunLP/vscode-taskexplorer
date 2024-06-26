/* eslint-disable @typescript-eslint/naming-convention */

import { ConfigurationChangeEvent, Event } from "vscode";

export const enum ConfigPrefix
{
    Base = "taskexplorer",
	Pinned = "taskexplorer.pinned.",
	SpecialFolder = "taskexplorer.specialFolder."
}

export const ConfigDefaults =
{
    GroupMaxLevel: 5,
    GroupSeparator: "-",
    GroupWithSeparator: true,
    GroupScripts: true,
    GroupStripTaskLabel: true,
    GroupStripScriptLabel: false,
    LogEnable: false
};

export enum ConfigKeys
{
    AllowUsageReporting = "allowUsageReporting",
    EnableAnsiconForAnt = "enableAnsiconForAnt",
    EnableExplorerTree = "enableExplorerView",
    EnableSideBar = "enableSideBar",
    EnablePersistenFileCache = "enablePersistentFileCaching",
    EnabledTasks = "enabledTasks",
    Environment = "environment",
    ExcludeGlobs = "exclude",
    ExcludeTaskRegexes = "excludeTask",
    GlobPatternsAnt = "globPatternsAnt",
    GlobPatternsBash = "globPatternsBash",
    GlobPatternsNode = "globPatternsNode",
    GroupMaxLevel = "groupMaxLevel",
    GroupScripts = "groupScripts",
    GroupSeparator = "groupSeparator",
    GroupStripTaskLabel = "groupStripTaskLabel",
    GroupStripScriptLabel = "groupStripScriptLabel",
    GroupWithSeparator = "groupWithSeparator",
    HttpProxy = "httpProxy",
    IncludeAnt = "includeAnt",
    KeepTerminalOnTaskDone = "keepTermOnStop",
    LogEnable = "logging.enable",
    LogLevel = "logging.level",
    LogEnableModuleReload = "logging.enableModuleReload",
    LogEnableOutputWindow = "logging.enableOutputWindow",
    LogEnableFile = "logging.enableFile",
    PathToPrograms = "pathToPrograms",
    ReportGlobalUsage = "taskMonitor.reportUsage",
    ShowHiddenVSCodeWsTasks = "showHiddenWsTasks",
    SortProjectFoldersAlphabetically = "sortProjectFoldersAlpha",
    SpecialFoldersFolderState = "specialFolders.folderState",
    SpecialFoldersNumLastTasks = "specialFolders.numLastTasks",
    SpecialFoldersShowFavorites = "specialFolders.showFavorites",
    SpecialFoldersShowLastTasks = "specialFolders.showLastTasks",
    SpecialFoldersShowUserTasks = "specialFolders.showUserTasks",
    TaskButtonsClickAction = "taskButtons.clickAction",
    TaskButtonsControlCharacter = "taskButtons.controlCharacter",
    TaskMonitorTimerMode = "taskMonitor.timerMode",
    TaskMonitorTrackStats = "taskMonitor.trackStats",
    TrackUsage = "trackUsage",
    UseNpmProvider = "useNpmProvider"
};

export interface IConfiguration
{
    baseSection: string;
    onDidChange: Event<ConfigurationChangeEvent>;
    affectsConfiguration(e: ConfigurationChangeEvent, ...settings: string[]): boolean;
    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue?: T): T;
    getVs<T>(key: string): T | undefined;
    getVs<T>(key: string, defaultValue?: T): T;
    update(key: string, value: any): Thenable<void>;
    updateVs(key: string, value: any): Thenable<void>;
    updateVsWs(key: string, value: any): Thenable<void>;
    updateWs(key: string, value: any): Thenable<void>;
}

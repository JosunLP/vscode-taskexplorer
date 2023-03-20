/* eslint-disable @typescript-eslint/naming-convention */

import { IDictionary, TeTaskListType } from "../interface";

export const Strings =
{
	DEFAULT_SEPARATOR: "-",
    LAST_TASKS_STORE: "lastTasks",
    LAST_TASKS_LABEL: "Last Tasks",
    FAV_TASKS_STORE: "favoriteTasks",
    FAV_TASKS_LABEL: "Favorites",
    USER_TASKS_LABEL: "User Tasks",
    TASKS_RENAME_STORE: "Renames",
    GetLicense: "Open the Task Explorer checkout page in  an external browser",
	ScanningTaskFiles: "appstrings.scanningTaskFiles|Scanning task files...",
	RequestingTasks: "appstrings.requestingTasks|Requesting tasks from providers...",
	BuildingTaskTree: "appstrings.buildingTaskTree|Building task tree...",
	NoTasks: "appstrings.noTasks|No tasks found"
};

export const ConfigKeys =
{
    AllowUsageReporting: "allowUsageReporting",
    EnableExplorerTree: "enableExplorerView",
    EnableSideBar: "enableSideBar",
    EnablePersistenFileCache: "enablePersistentFileCaching",
    GroupMaxLevel: "groupMaxLevel",
    GroupSeparator: "groupSeparator",
    GroupStripTaskLabel: "groupStripTaskLabel",
    GroupWithSeperator: "groupWithSeparator",
    KeepTerminalOnTaskDone: "keepTermOnStop",
    ReportGlobalUsage: "taskMonitor.reportUsage",
    SortProjectFoldersAlphabetically: "sortProjectFoldersAlpha",
	SpecialFolders: {
        NumLastTasks: "specialFolders.numLastTasks",
        ShowFavorites: "specialFolders.showFavorites",
        ShowLastTasks: "specialFolders.showLastTasks"
    },
    TaskButtons: {
        ClickAction: "taskButtons.clickAction",
        ControlCharacter: "taskButtons.controlCharacter"
    },
    TaskMonitor: {
        TimerMode: "taskMonitor.timerMode",
        TrackStats: "taskMonitor.trackStats"
    },
    TrackUsage: "trackUsage"
};

export const Globs: IDictionary<string> =
{
    GLOB_ANT: "**/[Bb][Uu][Ii][Ll][Dd].[Xx][Mm][Ll]",
    GLOB_APPPUBLISHER: "**/.publishrc*",
    GLOB_MAVEN: "**/pom.xml",
    GLOB_BASH: "**/*.[Ss][Hh]",
    GLOB_BATCH: "**/*.{[Bb][Aa][Tt],[Cc][Mm][Dd]}",
    GLOB_GULP: "**/[Gg][Uu][Ll][Pp][Ff][Ii][Ll][Ee].{[Jj][Ss],[Tt][Ss],[Mm][Jj][Ss],[Bb][Aa][Bb][Ee][Ll].[Jj][Ss]}",
    GLOB_GRADLE: "**/*.[Gg][Rr][Aa][Dd][Ll][Ee]",
    GLOB_GRUNT: "**/[Gg][Rr][Uu][Nn][Tt][Ff][Ii][Ll][Ee].[Jj][Ss]",
    GLOB_JENKINS: "**/[Jj]enkinsfile",
    GLOB_MAKE: "**/[Mm]akefile",
    GLOB_NPM: "**/package.json",
    GLOB_NSIS: "**/*.[Nn][Ss][Ii]",
    GLOB_PERL: "**/*.[Pp][Ll]",
    GLOB_COMPOSER: "**/composer.json",
    GLOB_POWERSHELL: "**/*.[Pp][Ss]1",
    GLOB_PYTHON: "**/*.[Pp][Yy]",
    GLOB_PIPENV: "**/[Pp][Ii][Pp][Ff][Ii][Ll][Ee]",
    GLOB_RUBY: "**/*.rb",
    GLOB_TSC: "**/tsconfig.{json,*.json}",
    GLOB_WEBPACK: "**/[Ww][Ee][Bb][Pp][Aa][Cc][Kk].{js,*.js,json,*.json}",
    GLOB_WORKSPACE: "**/.vscode/tasks.json"
};

export type PinnedStorageKey = `taskexplorer.pinned.${TeTaskListType}`;

export const StorageKeys =
{
    Account: "taskexplorer.account",
    CacheBuster: "taskexplorer.cacheBuster",
    FileCacheProjectFilesMap: "fileCacheProjectFilesMap",
    FileCacheProjectFileToFileCountMap: "fileCacheProjectFileToFileCountMap",
    FileCacheTaskFilesMap: "fileCacheTaskFilesMap",
    LastLicenseNag: "taskexplorer.lastLicenseNag",
	TaskUsage: "taskexplorer.taskUsage",
	Usage: "taskexplorer.usage",
    Version: "taskexplorer.version"
};

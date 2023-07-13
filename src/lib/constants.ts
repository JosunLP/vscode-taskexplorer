/* eslint-disable @typescript-eslint/naming-convention */

import {
    TeTaskListType, ConfigPrefix, ITeKeys, ConfigKeys, ContextKeys, StorageKeys, UsageKeys, VsCodeCommands, Commands
} from "../interface";

export const Constants: Record<string, string> =
{
    GlobalFrameworkConfName: "global",
    GlobalFrameworkProjectName: "global"
};

export const Numbers: Record<string, number> =
{
    MaxGroupLevel: 10
};

export const Regex: Record<string, RegExp> =
{
    AppPublisherFileName: /\.publishrc\.(.+)\.(?:js(?:on)?|ya?ml)$/i,
    TsConfigFileName: /tsconfig\.(.+)\.json$/i,
    TsConfigLabel: /([a-z0-9\.\-_\\// ]+| )\- tsconfig\.([a-z0-9\.\-_]+?)\.?json$/i,
    TsConfigTaskLabel: / \- tsconfig\.([a-z0-9\.\-_]+?)\.?json$/i,
    WebpackFileName: /webpack\.config\.(.+)\.(?:js(?:on)?)$/i
};

export const Strings: Record<string, string> =
{
	DEFAULT_SEPARATOR: "-",
    LAST_TASKS_LABEL: "Last Tasks",
    FAV_TASKS_LABEL: "Favorites",
    USER_TASKS_LABEL: "User Tasks",
    GetLicense: "appstrings.getLicense|Open the Task Explorer checkout page in an external browser",
	ScanningTaskFiles: "appstrings.scanningTaskFiles|Scanning task files...",
	RequestingTasks: "appstrings.requestingTasks|Requesting tasks from providers...",
	BuildingTaskTree: "appstrings.buildingTaskTree|Building task tree...",
	NoTasks: "appstrings.noTasks|No tasks found"
};

export const Globs: Record<string, string> =
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
    GLOB_NODE: "**/bin/*.js",
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

export type PinnedStorageKey = `${ConfigPrefix.Pinned}${TeTaskListType}`;

export type SpecialFolderStorageKey = `${ConfigPrefix.SpecialFolder}${TeTaskListType}`;


export const All: ITeKeys =
{
    Commands,
    Config: ConfigKeys,
    Context: ContextKeys,
    Globs,
    Numbers,
    Regex,
    Storage: StorageKeys,
    Strings,
    Usage: UsageKeys,
    VsCodeCommands
};
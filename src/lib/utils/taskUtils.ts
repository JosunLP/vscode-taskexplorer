/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Usage } from "../usage";
import { storage } from "../storage";
import { Task, tasks } from "vscode";
import { TeWrapper } from "../wrapper";
import { pickBy, properCase } from "./commonUtils";
import { ITaskDefinition, ITeTask, TeTaskListType } from "../../interface";
import { PinnedStorageKey } from "../constants";


export function getScriptTaskTypes(): string[]
{
    return [
        "bash", "batch", "nsis", "perl", "powershell", "python", "ruby"
    ];
}


/**
 * @deprecated Use `isTaskTypeEnabled` and `getPathToProgram`
 * To be removed after the temp extension.tempRemapSettingsToNewLayout() method is removed.
 * @param taskType Task type, e.g. `npm`, `apppublisher`, `grunt`, `bash`, etc
 * @param settingPart String prependature for  commonly named setting name
 * @returns The task type's unique setting name
 */
/* istanbul ignore next */
export function getTaskTypeSettingName(taskType: string, settingPart: string)
{   /* istanbul ignore next */
    return settingPart + (!settingPart.endsWith(".") ? properCase(taskType) : taskType.toLowerCase());
}


/**
 * @deprecated Use `isTaskTypeEnabled`
 * To be removed after the temp extension.tempRemapSettingsToNewLayout() method is removed.
 * @param taskType Task type, e.g. `npm`, `apppublisher`, `grunt`, `bash`, etc
 * @returns The task type's unique setting name
 */
/* istanbul ignore next */
export function getTaskTypeEnabledSettingName(taskType: string)
{   /* istanbul ignore next */
    return getTaskTypeSettingName(taskType, "enabledTasks.");
}


export function getTaskTypes()
{
    return [
        "ant", "apppublisher", "bash", "batch", "composer",  "gradle", "grunt", "gulp", "jenkins", "make",
        "maven", "npm", "nsis", "perl", "powershell", "python", "pipenv", "ruby", "tsc", "webpack",  "Workspace"
    ];
}
// Will bomb because we reference the fn in runTest. Just keep a static list i guess.  leaving commented for now...
// export function getTaskTypes(includeExternal = false)
// {
//     return [ ...Object.keys(providers).filter(k => includeExternal || !providers[k].isExternal), ...getWatchTaskTypes() ];
// }


export function getTaskTypeFriendlyName(taskType: string, lowerCase = false)
{
    taskType = taskType.toLowerCase();
    if (taskType === "workspace") {
        return lowerCase ? "vscode" : "VSCode";
    }
    else if (taskType === "apppublisher") {
        return lowerCase ? "app-publisher" : "App-Publisher";
    }
    else if (taskType === "tsc") {
        return lowerCase ? "typescript" : "Typescript";
    }
    return lowerCase ? taskType : properCase(taskType);
}


export function getTaskTypeRealName(taskType: string)
{
    taskType = taskType.toLowerCase();
    if (taskType === "workspace") {
        return "Workspace";
    }
    return taskType;
}


export function getWatchTaskTypes()
{
    return [ "npm", "tsc", "Workspace" ];
}


export function isScriptType(source: string)
{
    return getScriptTaskTypes().includes(source);
}


export function isWatchTask(source: string)
{
    return getWatchTaskTypes().includes(source);
}


/**
 * @method toITask
 * @since 3.0.0
 * @param usageTracker The application usage tracker instance
 * @param teTasks Array of ITeTask[]
 * @param listType Task list type
 * @param isRunning Provide when on;y when one task is being converted
 * @param usage Provide when on;y when one task is being converted
 */
export const toITask = (wrapper: TeWrapper, teTasks: Task[], listType: TeTaskListType): ITeTask[] =>
{
    return teTasks.map<ITeTask>(t =>
    {
        let runCount;
        const usage = wrapper.usage.get(`task:${t.definition.taskItemId}`);
        const running = tasks.taskExecutions.filter(e => e.task.name === t.name && e.task.source === t.source &&
                                                    e.task.scope === t.scope && e.task.definition.path === t.definition.path).length > 0;
        if (usage) {
            runCount = { ...usage.count };
        }
        else {
            runCount = {
                today: 0,
                last7Days: 0,
                last14Days: 0,
                last30Days: 0,
                last60Days: 0,
                last90Days: 0,
                total: 0,
                yesterday: 0
            };
        }
        return {
            definition: pickBy<ITaskDefinition>(t.definition, (k => k !== "uri")),
            listType,
            name: t.name,
            pinned: isPinned(t.definition.taskItemId, listType),
            runCount,
            running,
            source: t.source,
            treeId: t.definition.taskItemId,
            runTime: wrapper.usage.getRuntimeInfo(t.definition.taskItemId)
        };
    });
};


export const isPinned = (id: string, listType: TeTaskListType): boolean =>
{
    const storageKey: PinnedStorageKey = `taskexplorer.pinned.${listType}`;
    const pinnedTaskList = storage.get<ITeTask[]>(storageKey, []);
    return !!pinnedTaskList.find(t => t.treeId === id);
};
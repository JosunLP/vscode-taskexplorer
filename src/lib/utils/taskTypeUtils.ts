/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { Task, tasks } from "vscode";
import { ITeTask, TeTaskListType } from "../../interface";
import { properCase } from "./commonUtils";
import { storage } from "./storage";


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


export const toITask = (teTasks: Task[], listType: TeTaskListType, isRunning?: boolean): ITeTask[] =>
{
    return teTasks.map<ITeTask>(t =>
    {
        const running = isRunning !== undefined ? isRunning :
              tasks.taskExecutions.filter(e => e.task.name === t.name && e.task.source === t.source &&
                                          e.task.scope === t.scope && e.task.definition.path === t.definition.path).length > 0;
        return {
            name: t.name,
            definition: t.definition,
            source: t.source,
            running,
            listType,
            runCount: 0, // TODO - add run count
            treeId: t.definition.taskItemId,
            pinned: isPinned(t.definition.taskItemId, listType)
        };
    });
};


export const isPinned = (id: string, listType: TeTaskListType): boolean =>
{
    const storageKey = `taskexplorer.pinned.${listType}`;
    const pinnedTaskList = storage.get<ITeTask[]>(storageKey, []);
    return !!pinnedTaskList.find(t => t.treeId === id);
};

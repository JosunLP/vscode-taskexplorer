/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { pickBy } from "./object";
import { storage } from "../storage";
import { Task, tasks } from "vscode";
import { TeWrapper } from "../wrapper";
import { properCase } from "./commonUtils";
import { configuration } from "../configuration";
import { getCombinedGlobPattern } from "./utils";
import { Globs, PinnedStorageKey } from "../constants";
import {
    ConfigPrefix, ITaskDefinition, ITeTask, ITeWrapper, TaskScriptType, TaskSource, TeTaskListType,
    TeTaskScriptType, TeTaskSource
} from "../../interface";


export const getGlobPattern = (taskType: string) =>
{
    if (taskType === "ant") {
        return getCombinedGlobPattern(Globs.GLOB_ANT,
                [ ...configuration.get<string[]>("includeAnt", []), ...configuration.get<string[]>("globPatternsAnt", []) ]);
    }
    else if (hasExtraGlob(taskType)) {
        return getCombinedGlobPattern(Globs[`GLOB_${taskType.toUpperCase()}`], configuration.get<string[]>(`globPatterns${properCase(taskType)}`, []));
    }
    else {
        return Globs["GLOB_" + taskType.toUpperCase()];
    }
};


export const getScriptTaskTypes = (): readonly TeTaskScriptType[] => TaskScriptType;


/**
 * @deprecated Use `isTaskTypeEnabled` and `getPathToProgram`
 * To be removed sometime after the v3 release and  settings migration.
 * @param taskType Task type, e.g. `npm`, `apppublisher`, `grunt`, `bash`, etc
 * @param settingPart String prependature for  commonly named setting name
 * @returns The task type's unique setting name
 */
/* istanbul ignore next */
export const getTaskTypeSettingName = (taskType: string, settingPart: string) =>
    settingPart + (!settingPart.endsWith(".") ? properCase(taskType) : taskType.toLowerCase());


/**
 * @deprecated Use `isTaskTypeEnabled`
 * To be removed sometime after the v3 release and  settings migration.
 * @param taskType Task type, e.g. `npm`, `apppublisher`, `grunt`, `bash`, etc
 * @returns The task type's unique setting name
 */
/* istanbul ignore next */
export const getTaskTypeEnabledSettingName = (taskType: string) => getTaskTypeSettingName(taskType, "enabledTasks.");


export const getTaskTypes = (): readonly TeTaskSource[] => TaskSource;


// Will bomb because we reference the fn in runTest. Just keep a static list i guess.  leaving commented for now...
// export function getTaskTypes(includeExternal = false)
// {
//     return [ ...Object.keys(providers).filter(k => includeExternal || !providers[k].isExternal), ...getWatchTaskTypes() ];
// }


export const getTaskTypeFriendlyName = (taskType: string, lowerCase = false) =>
{
    const taskTypeLwr = taskType.toLowerCase();
    if (taskTypeLwr === "workspace") {
        return lowerCase ? "vscode" : "VSCode";
    }
    else if (taskTypeLwr === "apppublisher") {
        return lowerCase ? "app-publisher" : "App-Publisher";
    }
    else if (taskTypeLwr === "tsc") {
        return lowerCase ? "typescript" : "Typescript";
    }
    else if (taskTypeLwr === "node") {
        return lowerCase ? "nodejs" : "NodeJS";
    }
    return lowerCase ? taskTypeLwr : properCase(taskType);
};


export const getTaskTypeRealName = (taskType: string): TeTaskSource =>
{
    const taskTypeLwr = taskType.toLowerCase();
    if (taskTypeLwr === "workspace") {
        return "Workspace";
    }
    return <TeTaskSource>taskType;
};

                                                                                                              //
                                                                                                              // TODO - Remove istanbul tag after internal npm provider tests are written
export const getWatchTaskTypes = (wrapper: ITeWrapper) =>                                                     //
    !wrapper.config.get<boolean>(wrapper.keys.Config.UseNpmProvider, false) ? [ "npm", "tsc", "Workspace" ] : /* istanbul ignore next */[ "tsc", "Workspace" ];


const hasExtraGlob = (taskType: string) =>  [ "ant", "bash", "node" ].includes(taskType);


export const isPinned = (id: string, listType: TeTaskListType): boolean =>
{
    const storageKey: PinnedStorageKey = `${ConfigPrefix.Pinned}${listType}`,
          pinnedTaskList = storage.get<ITeTask[]>(storageKey, []);
    return !!pinnedTaskList.find(t => t.treeId === id);
};


export const isScriptType = (source: TeTaskSource) => (<TeTaskSource[]>getScriptTaskTypes()).includes(source);


export const isConstTaskCountType = (taskType: TeTaskSource) =>
    taskType === "apppublisher" || taskType === "maven" || taskType === "tsc" || taskType === "jenkins" || taskType === "webpack";


export const isWatchTask = (source: TeTaskSource, wrapper: ITeWrapper) => getWatchTaskTypes(wrapper).includes(source);


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
            definition: pickBy<ITaskDefinition>(t.definition, k => k !== "uri"),
            listType,
            name: t.name,
            pinned: isPinned(t.definition.taskItemId, listType),
            runCount,
            running,
            source: <TeTaskSource>t.source,
            treeId: t.definition.taskItemId,
            fsPath: t.definition.uri?.fsPath,
            runTime: wrapper.usage.getRuntimeInfo(t.definition.taskItemId)
        };
    });
};

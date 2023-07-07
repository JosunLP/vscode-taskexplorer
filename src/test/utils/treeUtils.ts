/* eslint-disable import/no-extraneous-dependencies */

import { expect } from "chai";
import { sleep, testControl as tc, waitForTeIdle } from "./utils";
import { executeSettingsUpdate, executeTeCommand } from "./commandUtils";
import { ITaskItem, ITeWrapper } from ":types";

interface TaskMap { [id: string]: ITaskItem | undefined };

let didRefresh = false;
let didSetGroupLevel = false;


export const hasRefreshed = () => didRefresh;


export const findTaskTypeInTaskMap = (taskType: string, tMap: TaskMap) =>
    Object.values(tMap).filter((t): t is ITaskItem => !!t && t.taskSource === taskType && !t.isUser);


export const getTreeTasks = async(teWrapper: ITeWrapper, taskType: string, expectedCount: number) =>
{
    const _getTaskMap = async(retries: number): Promise<TaskMap> =>
    {
        let taskMap = teWrapper.treeManager.taskMap;

        if (!taskMap || teWrapper.typeUtils.isObjectEmpty(taskMap) || !findTaskTypeInTaskMap(taskType, taskMap))
        {
            await waitForTeIdle(150, 1600);
            taskMap = teWrapper.treeManager.taskMap;
        }

        if (!taskMap || teWrapper.typeUtils.isObjectEmpty(taskMap) || !findTaskTypeInTaskMap(taskType, taskMap))
        {
            if (retries === 0) {
                console.log(`    ${teWrapper.figures.color.warning} ${teWrapper.figures.withColor("Task map is empty, retry", teWrapper.figures.colors.grey)}`);
            }
            if (retries % 10 === 0)
            {
                await refresh(teWrapper);
                taskMap = teWrapper.treeManager.taskMap;
            }
            if (!taskMap || teWrapper.typeUtils.isObjectEmpty(taskMap))
            {
                if (retries === 40) {
                    console.log(`    ${teWrapper.figures.color.error} ${teWrapper.figures.withColor("Task map is empty, test will fail in 3, 2, 1...", teWrapper.figures.colors.grey)}`);
                }
                else {
                    await sleep(250);
                    taskMap = await _getTaskMap(++retries);
                }
            }
        }

        return taskMap || {} as TaskMap;
    };

    const taskMap = await _getTaskMap(0),
          tasks = taskMap ? findTaskTypeInTaskMap(taskType, taskMap) : [];
    if (tasks.length !== expectedCount)
    {
        if (Object.keys(taskMap).length === 0) {
            console.log(`    ${teWrapper.figures.color.warning} ${teWrapper.figures.withColor("Task map is empty.", teWrapper.figures.colors.grey)}`);
        }
        else {
            console.log(`    ${teWrapper.figures.color.warning} ${teWrapper.figures.withColor(`Unexpected ${taskType} task count (Found ${tasks.length} of ${expectedCount})`, teWrapper.figures.colors.grey)}`);
            console.log(teWrapper.figures.withColor(`    Task items found:\n    ${teWrapper.figures.color.warning}    ` +
                        tasks.map(i => i.label).join(`\n    ${teWrapper.figures.color.warning}    `), teWrapper.figures.colors.grey));
        }
        console.log(teWrapper.figures.withColor(`    ${teWrapper.figures.color.warning} All TaskMap items:\n    ${teWrapper.figures.color.warning}    ` +
                    Object.keys(taskMap).map(k => Buffer.from(k, "hex").toString("utf8")).join(`\n    ${teWrapper.figures.color.warning}    `), teWrapper.figures.colors.grey));
        expect.fail(`${teWrapper.figures.color.error} Unexpected ${taskType} task count (Found ${tasks.length} of ${expectedCount})`);
    }

    return [ ...Object.values(taskMap).filter((t): t is ITaskItem => !!t && t.taskSource === taskType) ];
};


/**
 * Pretty much mimics the tree construction in cases when we want to construct it
 * when the tree view is collapsed and not updating automatically via GUI events.
 * Once the view/shelf is focused/opened somewhere within the running tests, there'd
 * be no need to call this function anymore.
 *
 * @param instance The test instance to set the timeout and slow time on.
 */
export const refresh = async(teWrapper: ITeWrapper, instance?: any) =>
{
    if (instance)
    {
        instance.slow(tc.slowTime.commands.refresh +
                      (!didSetGroupLevel ? (tc.slowTime.config.groupingEvent * 2) : 0) +
                      (!didRefresh ? 1000 : 0));
        instance.timeout((tc.slowTime.commands.refresh  * 2) + (!didSetGroupLevel ? (tc.slowTime.config.groupingEvent * 2) : 0));
        if (!didSetGroupLevel)
        {
            // utils.getTeApi().testsApi.enableConfigWatcher(false);
            await executeSettingsUpdate(teWrapper.keys.Config.GroupWithSeperator, true, tc.waitTime.config.groupingEvent);
            await executeSettingsUpdate(teWrapper.keys.Config.GroupMaxLevel, 5, tc.waitTime.config.groupingEvent);
            // utils.getTeApi().testsApi.enableConfigWatcher(true);
            didSetGroupLevel = true;
        }
    }
    await executeTeCommand("refresh", tc.waitTime.refreshCommand);
    didRefresh = true;
};



export const verifyTaskCountByTree = async(teWrapper: ITeWrapper, taskType: string, expectedCount: number, retries = 2) =>
{
    let taskMap = teWrapper.treeManager.taskMap;
    const _getCount = async() =>
    {
        if (!taskMap || teWrapper.typeUtils.isObjectEmpty(taskMap)) {
            await refresh(teWrapper);
            taskMap = teWrapper.treeManager.taskMap;
        }
        return findTaskTypeInTaskMap(taskType, taskMap).length;
    };
    let retry = 0;
    let taskCount = await _getCount();
    while (expectedCount !== taskCount && ++retry <= retries) {
        await sleep(300);
        taskCount = await _getCount();
    }
    try {
        expect(taskCount).to.be.equal(expectedCount, `${teWrapper.figures.color.error} Unexpected ${taskType} task count (Found ${taskCount} of ${expectedCount})`);
    }
    catch (e) {
        console.log(teWrapper.figures.withColor(`    ${teWrapper.figures.color.warning} All TaskMap items:\n    ${teWrapper.figures.color.warning}    ` +
                    Object.keys(taskMap).map(k => Buffer.from(k, "hex").toString("utf8")).join(`\n    ${teWrapper.figures.color.warning}    `), teWrapper.figures.colors.grey));
        throw e;
    }
};

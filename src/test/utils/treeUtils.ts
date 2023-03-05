/* eslint-disable import/no-extraneous-dependencies */

import { expect } from "chai";
import { ConfigKeys } from "../../lib/constants";
import { executeSettingsUpdate, executeTeCommand } from "./commandUtils";
import { sleep, testControl as tc, waitForTeIdle } from "./utils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";

interface TaskMap { [id: string]: ITaskItem | undefined };

let didRefresh = false;
let didSetGroupLevel = false;


export const hasRefreshed = () => didRefresh;


export const findIdInTaskMap = (id: string, tMap: TaskMap) => Object.values(tMap).filter((t) => t && t.id?.includes(id) && !t.isUser).length;


export const getTreeTasks = async(teWrapper: ITeWrapper, taskType: string, expectedCount: number) =>
{
    const taskItems: ITaskItem[] = [];

    const _getTaskMap = async(retries: number): Promise<TaskMap> =>
    {
        let taskMap = teWrapper.treeManager.getTaskMap();

        if (!taskMap || teWrapper.typeUtils.isObjectEmpty(taskMap) || !findIdInTaskMap(`:${taskType}:`, taskMap))
        {
            await waitForTeIdle(150, 1600);
            taskMap = teWrapper.treeManager.getTaskMap();
        }

        if (!taskMap || teWrapper.typeUtils.isObjectEmpty(taskMap) || !findIdInTaskMap(`:${taskType}:`, taskMap))
        {
            if (retries === 0) {
                console.log(`    ${teWrapper.figures.color.warning} ${teWrapper.figures.withColor("Task map is empty, retry", teWrapper.figures.colors.grey)}`);
            }
            if (retries % 10 === 0)
            {
                await refresh();
                taskMap = teWrapper.treeManager.getTaskMap();
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

    const taskMap = await _getTaskMap(0);
    const taskCount = taskMap ? findIdInTaskMap(`:${taskType}:`, taskMap) : 0;
    if (taskCount !== expectedCount)
    {
        console.log(`    ${teWrapper.figures.color.warning} ${teWrapper.figures.withColor("Task map is empty.", teWrapper.figures.colors.grey)}`);
        console.log(teWrapper.figures.withColor(`    ${teWrapper.figures.color.warning} TaskMap files:\n    ${teWrapper.figures.color.warning}    ` +
                    Object.keys(taskMap).join(`\n    ${teWrapper.figures.color.warning}    `), teWrapper.figures.colors.grey));
        expect.fail(`${teWrapper.figures.color.error} Unexpected ${taskType} task count (Found ${taskCount} of ${expectedCount})`);
    }

    Object.values(taskMap).forEach((taskItem) =>
    {
        if (taskItem && taskItem.taskSource === taskType) {
            taskItems.push(taskItem);
        }
    });

    return taskItems;
};


/**
 * Pretty much mimics the tree construction in cases when we want to construct it
 * when the tree view is collapsed and not updating automatically via GUI events.
 * Once the view/shelf is focused/opened somewhere within the running tests, there'd
 * be no need to call this function anymore.
 *
 * @param instance The test instance to set the timeout and slow time on.
 */
export const refresh = async(instance?: any) =>
{
    if (instance)
    {
        instance.slow(tc.slowTime.commands.refresh +
                      (!didSetGroupLevel ? (tc.slowTime.config.groupingEvent * 2) : 0) +
                      (!didRefresh ? 1000 : 0));
        instance.sleep((tc.slowTime.commands.refresh  * 2) + (!didSetGroupLevel ? (tc.slowTime.config.groupingEvent * 2) : 0));
        if (!didSetGroupLevel)
        {
            // utils.getTeApi().testsApi.enableConfigWatcher(false);
            await executeSettingsUpdate(ConfigKeys.GroupWithSeperator, true, tc.waitTime.config.groupingEvent);
            await executeSettingsUpdate(ConfigKeys.GroupMaxLevel, 5, tc.waitTime.config.groupingEvent);
            // utils.getTeApi().testsApi.enableConfigWatcher(true);
            didSetGroupLevel = true;
        }
    }
    await executeTeCommand("refresh", tc.waitTime.refreshCommand);
    didRefresh = true;
};



export const verifyTaskCountByTree = async(teWrapper: ITeWrapper, taskType: string, expectedCount: number, retries = 2) =>
{
    let taskMap = teWrapper.treeManager.getTaskMap();
    const _getCount = async() =>
    {
        if (!taskMap || teWrapper.typeUtils.isObjectEmpty(taskMap)) {
            await refresh();
            taskMap = teWrapper.treeManager.getTaskMap();
        }
        return findIdInTaskMap(`:${taskType}:`, taskMap);
    };
    let retry = 0;
    let taskCount = await _getCount();
    while (expectedCount !== taskCount && ++retry <= retries) {
        await sleep(300);
        taskCount = await _getCount();
    }
    expect(taskCount).to.be.equal(expectedCount, `${teWrapper.figures.color.error} Unexpected ${taskType} task count (Found ${taskCount} of ${expectedCount})`);
};

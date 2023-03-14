
import {  refresh } from "./treeUtils";
import { focusExplorerView, focusSidebarView } from "./commandUtils";
import { endRollingCount, exitRollingCount, needsTreeBuild, sleep, testControl as tc, waitForTeIdle } from "./utils";


export const startupBuildTree = async(instance: Mocha.Context) =>
{
    if (exitRollingCount(instance)) return;
    if (needsTreeBuild()) {
        await refresh(instance);
    }
    endRollingCount(instance);
};


export const startupFocus = async(instance: Mocha.Context, cb?: () => Promise<void>) =>
{
    if (exitRollingCount(instance)) return;
    if (needsTreeBuild(true)) {
        await focusExplorerView(undefined, instance);
    }
    else {
        await sleep(1);
        await waitForTeIdle(tc.waitTime.min);
    }
    if (cb) {
        await cb();
    }
    endRollingCount(instance);
};


export const sidebarFocus = async(instance: Mocha.Context) =>
{
    if (exitRollingCount(instance)) return;
    instance.sleep(tc.slowTime.commands.focus + tc.slowTime.commands.refresh);
    await focusSidebarView();
    endRollingCount(instance);
};


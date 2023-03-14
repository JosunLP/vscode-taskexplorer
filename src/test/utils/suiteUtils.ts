
import {  refresh } from "./treeUtils";
import { focusExplorerView, focusSidebarView } from "./commandUtils";
import { endRollingCount, exitRollingCount, needsTreeBuild, testControl } from "./utils";


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
    if (cb) {
        await cb();
    }
    endRollingCount(instance);
};


export const sidebarFocus = async(instance: Mocha.Context) =>
{
    if (exitRollingCount(instance)) return;
    instance.sleep(testControl.slowTime.commands.focus + testControl.slowTime.commands.refresh);
    await focusSidebarView();
    endRollingCount(instance);
};


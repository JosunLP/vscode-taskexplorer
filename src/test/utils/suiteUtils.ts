
import { hasRefreshed, refresh } from "./treeUtils";
import { focusExplorerView, focusSidebarView } from "./commandUtils";
import { endRollingCount, exitRollingCount, sleep, testControl as tc, waitForTeIdle } from "./utils";

let explorerHasFocused = false;

const hasExplorerFocused = () => explorerHasFocused;

const needsTreeBuild = (isFocus?: boolean) => (isFocus || !hasRefreshed()) && !hasExplorerFocused();


export const startupBuildTree = async(teWrapper: any, instance: Mocha.Context) =>
{
    if (exitRollingCount(instance)) return;
    if (needsTreeBuild()) {
        await refresh(teWrapper, instance);
    }
    endRollingCount(instance);
};


export const startupFocus = async(instance: Mocha.Context, cb?: () => PromiseLike<any> | any) =>
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
    explorerHasFocused = true;
    endRollingCount(instance);
};


export const sidebarFocus = async(instance: Mocha.Context) =>
{
    if (exitRollingCount(instance)) return;
    instance.sleep(tc.slowTime.commands.focus + tc.slowTime.commands.refresh);
    await focusSidebarView();
    endRollingCount(instance);
};


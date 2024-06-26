
import { ITeWrapper } from ":types";
import { startupFocus } from "../../utils/suiteUtils";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import { activate, endRollingCount, exitRollingCount, suiteFinished, testControl, treeUtils } from "../../utils/utils";

const testsName = "Workspace";
const startTaskCount = 10; // 10 + 3 'User' Tasks, but getTaskCountByTree() will not return the User tasks

let teWrapper: ITeWrapper;
let wsEnable: boolean;


suite("Workspace / VSCode Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate());
        wsEnable = teWrapper.config.get<boolean>(teWrapper.keys.Config.ShowHiddenVSCodeWsTasks, false);
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        await teWrapper.config.updateWs(teWrapper.keys.Config.ShowHiddenVSCodeWsTasks, wsEnable);
        suiteFinished(this);
    });


    test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});



    test("Show VSCode Tasks Marked Hidden", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.event + testControl.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate(teWrapper.keys.Config.ShowHiddenVSCodeWsTasks, true);
        await treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Hide VSCode Tasks Marked Hidden", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate(teWrapper.keys.Config.ShowHiddenVSCodeWsTasks, false);
        await treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount - 1);
        endRollingCount(this);
    });


    test("Disable User Tasks", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.showHideUserTasks); // + testControl.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate("specialFolders.showUserTasks", false, testControl.waitTime.config.showHideUserTasks);
        // TODO - I don't think verifyTaskCountByTree(teWrapper, ) returns User tasks.
        // await treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount - 4);
        endRollingCount(this);
    });


    test("Disable Workspace Tasks", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate("enabledTasks.workspace", false);
        await treeUtils.verifyTaskCountByTree(teWrapper, testsName, 0);
        endRollingCount(this);
    });


    test("Re-enable Workspace Tasks", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEventWorkspace + testControl.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate("enabledTasks.workspace", true);
        await treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount - 1);
        endRollingCount(this);
    });


    test("Re-show VSCode Tasks Marked Hidden", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate(teWrapper.keys.Config.ShowHiddenVSCodeWsTasks, true);
        await treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Re-enable User Tasks", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.showHideUserTasks + testControl.slowTime.tasks.count.verifyByTree);
        await executeSettingsUpdate("specialFolders.showUserTasks", true, testControl.waitTime.config.showHideUserTasks);
        await treeUtils.verifyTaskCountByTree(teWrapper, testsName, startTaskCount);
        endRollingCount(this);
    });

});

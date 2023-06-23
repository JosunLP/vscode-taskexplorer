/* eslint-disable prefer-arrow/prefer-arrow-functions */

import * as utils from "../utils/utils";
import { ITeWrapper } from "../../interface";
import { startupBuildTree } from "../utils/suiteUtils";
import { executeSettingsUpdate, executeTeCommand } from "../utils/commandUtils";

let teWrapper: ITeWrapper;
const tc = utils.testControl;


suite("File Cache Tests", () =>
{
    suiteSetup(async function()
    {
        if (utils.exitRollingCount(this, true)) return;
        ({ teWrapper } = await utils.activate(this));
        await teWrapper.storage.update2("fileCacheTaskFilesMap", undefined);
        await teWrapper.storage.update2("fileCacheProjectFilesMap", undefined);
        await teWrapper.storage.update2("fileCacheProjectFileToFileCountMap", undefined);
        utils.endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (utils.exitRollingCount(this, false, true)) return;
        await executeSettingsUpdate("enablePersistentFileCaching", false);
        await teWrapper.storage.update2("fileCacheTaskFilesMap", undefined);
        await teWrapper.storage.update2("fileCacheProjectFilesMap", undefined);
        await teWrapper.storage.update2("fileCacheProjectFileToFileCountMap", undefined);
        utils.suiteFinished(this);
    });


    test("Build Tree", async function()
    {
        await startupBuildTree(teWrapper, this);
    });


    test("Check Task Counts", async function()
    {
        if (utils.exitRollingCount(this)) return;
        await checkTaskCounts(this);
        utils.endRollingCount(this);
    });


    test("Enable Persistent Cache", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.event + tc.slowTime.cache.persist);
        await executeSettingsUpdate("enablePersistentFileCaching", true); // enabling setting will persist *now*
        utils.endRollingCount(this);
    });


    test("Rebuild File Cache (Mimic Startup)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuild + tc.slowTime.general.min);
        await teWrapper.fileCache.rebuildCache("", true);
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Check Task Counts", async function()
    {
        if (utils.exitRollingCount(this)) return;
        await checkTaskCounts(this);
        utils.endRollingCount(this);
    });


    test("Rebuild File Cache w Empty Persisted Cache (Mimic Startup)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuild + (tc.slowTime.config.event * 3) + (tc.slowTime.tasks.count.verify * 6));
        await teWrapper.storage.update2("fileCacheTaskFilesMap", undefined);
        await teWrapper.storage.update2("fileCacheProjectFilesMap", undefined);
        await teWrapper.storage.update2("fileCacheProjectFileToFileCountMap", undefined);
        await teWrapper.fileCache.rebuildCache("", true);
        await utils.sleep(5);
        await checkTaskCounts();
        utils.endRollingCount(this);
    });


    test("Disable Persistent Cache", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.event + tc.slowTime.config.event);
        await executeSettingsUpdate("enablePersistentFileCaching", false);
        utils.endRollingCount(this);
    });


    test("Rebuild File Cache (Mimic Startup)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuild + tc.slowTime.commands.fast);
        // await treeUtils.refresh(teWrapper, this);
        await teWrapper.fileCache.rebuildCache("", true);
        await utils.waitForTeIdle(tc.waitTime.commandFast);
        utils.endRollingCount(this);
    });


    test("Check Task Counts", async function()
    {
        if (utils.exitRollingCount(this)) return;
        await checkTaskCounts(this);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Not Busy)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + tc.waitTime.min);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy No Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + tc.waitTime.min);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 10ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 20);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(10);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 20ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 40);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(20);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 35ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 70);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(35);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 50ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 100);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(50);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });



    test("Cancel Rebuild Cache (Busy 75ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 150);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(75);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 100ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 200);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(100);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 150ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 200);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(150);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 200ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 400);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(200);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 300ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 1000);
        teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        await utils.sleep(300);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Rebuild Cache (Busy 500ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.rebuildCancel + 2000);
        void teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        void teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        void teWrapper.fileCache.rebuildCache(""); // Don't 'await'
        void teWrapper.fileCache.cancelBuildCache();
        void teWrapper.fileCache.cancelBuildCache();
        for (let i = 1; i <= 5 && teWrapper.fileCache.isBusy; i++) {
            await utils.sleep(100);
        }
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (No Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel);
        teWrapper.fileCache.buildTaskTypeCache("gulp", undefined, true, ""); // Don't 'await'
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 10ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 20);
        teWrapper.fileCache.buildTaskTypeCache("gulp", undefined, true, ""); // Don't 'await'
        await utils.sleep(10);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 20ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 40);
        teWrapper.fileCache.buildTaskTypeCache("python", undefined, true, ""); // Don't 'await'
        await utils.sleep(20);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 50ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 100);
        teWrapper.fileCache.buildTaskTypeCache("batch", undefined, true, ""); // Don't 'await'
        await utils.sleep(50);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 75ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 150);
        teWrapper.fileCache.buildTaskTypeCache("batch", undefined, true, ""); // Don't 'await'
        await utils.sleep(75);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 100ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 200);
        teWrapper.fileCache.buildTaskTypeCache("ant", undefined, true, ""); // Don't 'await'
        await utils.sleep(100);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 150ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 300);
        teWrapper.fileCache.buildTaskTypeCache("ant", undefined, true, ""); // Don't 'await'
        await utils.sleep(150);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 200ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 400);
        teWrapper.fileCache.buildTaskTypeCache("grunt", undefined, true, ""); // Don't 'await'
        await utils.sleep(200);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Cancel Build Cache (FileWatcher Build) (Busy 500ms Delay)", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.cache.buildCancel + 1000);
        teWrapper.fileCache.buildTaskTypeCache("grunt", undefined, true, ""); // Don't 'await'
        await utils.sleep(500);
        await teWrapper.fileCache.cancelBuildCache();
        await utils.sleep(5);
        utils.endRollingCount(this);
    });


    test("Rebuild Cache and Invaldate Providers after Cancel", async function()
    {
        if (utils.exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.refresh + 200);
        await executeTeCommand("refresh", tc.waitTime.refreshCommand);
        utils.endRollingCount(this);
    });


    test("Check Task Counts", async function()
    {
        if (utils.exitRollingCount(this)) return;
        await checkTaskCounts(this);
        utils.endRollingCount(this);
    });

});


const checkTaskCounts = async (instance?: Mocha.Context) =>
{
    if (instance) {
        instance.slow(tc.slowTime.tasks.count.verify * 6);
    }
    await utils.verifyTaskCount("bash", 1);
    await utils.verifyTaskCount("batch", 2);
    await utils.verifyTaskCount("npm", tc.isMultiRootWorkspace ? 17 : 2);
    await utils.verifyTaskCount("grunt", 7);
    await utils.verifyTaskCount("gulp", 17);
    await utils.verifyTaskCount("Workspace", 13); // 10 + 3 User Tasks
};

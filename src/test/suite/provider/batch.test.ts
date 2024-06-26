
import { join } from "path";
import { Uri } from "vscode";
import { expect } from "chai";
import { startupBuildTree } from "../../utils/suiteUtils";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import { ITaskExplorerApi, ITeWrapper } from ":types";
import {
    activate, getWsPath, testControl, verifyTaskCount, suiteFinished, exitRollingCount, waitForTeIdle, endRollingCount
} from "../../utils/utils";

const testsName = "batch";
const startTaskCount = 2;
const dirName = getWsPath("tasks_test_");
const fileUriBat = Uri.file(join(dirName, "test_provider_bat.bat"));
const fileUriCmd = Uri.file(join(dirName, "test_provider-cmd.cmd"));

let teWrapper: ITeWrapper;
let teApi: ITaskExplorerApi;


suite("Batch Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate());
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        await teWrapper.fs.deleteDir(dirName);
        suiteFinished(this);
    });


    test("Build Tree", async function()
    {
        await startupBuildTree(teWrapper, this);
    });


    test("Document Position", async function()
    {
        if (exitRollingCount(this)) return;
        const provider = teApi.providers[testsName];
        expect(provider.getDocumentPosition()).to.be.equal(0, "Script type should return position 0");
        endRollingCount(this);
    });


    test("Start", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.tasks.count.verify);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Resolve Task", async function()
    {
        if (exitRollingCount(this)) return;
        const provider = teApi.providers[testsName];
        provider.resolveTask((provider.cachedTasks as any[])[0]);
        endRollingCount(this);
    });


    test("Disable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks." + testsName, false, testControl.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, 0);
        endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks." + testsName, true, testControl.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Create Files", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.createFolderEvent + testControl.slowTime.fs.createFolderEvent + testControl.slowTime.tasks.count.verify);
        await teWrapper.fs.createDir(dirName);
        await waitForTeIdle(testControl.waitTime.fs.createFolderEvent);
        await teWrapper.fs.writeFile(fileUriBat.fsPath, "echo test 123\r\n\r\n");
        await teWrapper.fs.writeFile(fileUriCmd.fsPath, "echo test 123\r\n");
        await waitForTeIdle(testControl.waitTime.fs.createEvent + 50);
        await verifyTaskCount(testsName, startTaskCount + 2);
        endRollingCount(this);
    });


    test("Delete Files", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.deleteEvent + testControl.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(fileUriBat.fsPath);
        await teWrapper.fs.deleteFile(fileUriCmd.fsPath);
        await waitForTeIdle(testControl.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Re-create Files", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.createEvent + testControl.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(fileUriBat.fsPath, "echo test 123\r\n\r\n");
        await teWrapper.fs.writeFile(fileUriCmd.fsPath, "echo test 123\r\n");
        await waitForTeIdle(testControl.waitTime.fs.createEvent + 50);
        await verifyTaskCount(testsName, startTaskCount + 2);
        endRollingCount(this);
    });


    test("Delete Folder", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.deleteFolderEvent + testControl.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteDir(dirName);
        await waitForTeIdle(testControl.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });

});

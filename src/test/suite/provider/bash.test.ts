
import { join } from "path";
import { expect } from "chai";
import { Uri, workspace, WorkspaceFolder } from "vscode";
import { startupBuildTree } from "../../utils/suiteUtils";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import { ITaskExplorerApi, ITeWrapper } from ":types";
import {
    activate, getWsPath, testControl, verifyTaskCount, logErrorsAreFine, suiteFinished, exitRollingCount,
    waitForTeIdle, endRollingCount
} from "../../utils/utils";

const testsName = "bash";
const startTaskCount = 1;
const dirName = getWsPath("tasks_test_");
const fileUri = Uri.file(join(dirName, "test_provider.sh"));

let teWrapper: ITeWrapper;
let teApi: ITaskExplorerApi;
let wsFolder: WorkspaceFolder;


suite("Bash Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teApi, teWrapper } = await activate(this));
        wsFolder = (workspace.workspaceFolders as WorkspaceFolder[])[0];
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


    test("Invalid ScriptProvider Type", async function()
    {
        if (exitRollingCount(this)) return;
        const provider = teApi.providers[testsName];
        provider.createTask("no_ext", undefined, wsFolder, Uri.file(getWsPath("hello.sh")));
        logErrorsAreFine(true);
        endRollingCount(this);
    });


    test("Start", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.tasks.count.verify);
        await verifyTaskCount(testsName, startTaskCount);
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


    test("Create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.createFolderEvent + testControl.slowTime.fs.createFolderEvent + testControl.slowTime.tasks.count.verify);
        await teWrapper.fs.createDir(dirName);
        await waitForTeIdle(testControl.waitTime.fs.createFolderEvent);
        await teWrapper.fs.writeFile(fileUri.fsPath, "echo test 123\n\n");
        await waitForTeIdle(testControl.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 1);
        endRollingCount(this);
    });


    test("Delete File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.deleteEvent + testControl.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        await waitForTeIdle(testControl.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Re-create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.createEvent + testControl.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(fileUri.fsPath, "echo test 123\n\n");
        await waitForTeIdle(testControl.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 1);
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

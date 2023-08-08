

import * as path from "path";
import { expect } from "chai";
import { getTreeTasks } from "../../utils/treeUtils";
import { ITaskExplorerApi, ITeWrapper } from ":types";
import { startupFocus } from "../../utils/suiteUtils";
import { Uri, workspace, WorkspaceFolder } from "vscode";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import {
    activate, endRollingCount, exitRollingCount, getWsPath, logErrorsAreFine, suiteFinished,
    testControl as tc, verifyTaskCount, waitForTeIdle
} from "../../utils/utils";

const testsName = "python";
const startTaskCount = 5;

let teApi: ITaskExplorerApi;
let teWrapper: ITeWrapper;
let pathToTaskProgram: string;
let enableTaskType: boolean;
let wsFolder: WorkspaceFolder;
let dirName: string;
let fileUri: Uri;


suite("Python Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        //
        // Initialize
        //
        ({ teApi, teWrapper } = await activate());
        wsFolder = (workspace.workspaceFolders as WorkspaceFolder[])[0];
        dirName = getWsPath("tasks_test_");
        fileUri = Uri.file(path.join(dirName, "test2.py"));
        //
        // Store / set initial settings
        //
        pathToTaskProgram = teWrapper.config.get<string>("pathToPrograms." + testsName, "");
        enableTaskType = teWrapper.config.get<boolean>("enabledTasks." + testsName, false);
        await executeSettingsUpdate("pathToPrograms." + testsName, testsName + "/" + testsName + ".exe", tc.waitTime.config.event);
        await executeSettingsUpdate("enabledTasks." + testsName, true, tc.waitTime.config.enableEvent);
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        await executeSettingsUpdate("pathToPrograms." + testsName, pathToTaskProgram, tc.waitTime.config.event);
        await executeSettingsUpdate("enabledTasks." + testsName, enableTaskType, tc.waitTime.config.enableEvent);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupStripScriptLabel, false);
        await teWrapper.fs.deleteDir(dirName);
        suiteFinished(this);
    });


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


    test("Document Position", async function()
    {
        if (exitRollingCount(this)) return;
        const provider = teApi.providers[testsName];
        expect(provider.getDocumentPosition()).to.be.equal(0);
        endRollingCount(this);
    });


    test("Invalid ScriptProvider Type", async function()
    {
        if (exitRollingCount(this)) return;
        const provider = teApi.providers[testsName];
        expect(!provider.createTask("no_ext", undefined, wsFolder,
               Uri.file(getWsPath("test.py")))).to.not.be.equal(undefined, "ScriptProvider returned undefined task");
        logErrorsAreFine(true);
        endRollingCount(this);
    });


    test("Start", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.count.verify);
        await verifyTaskCount(testsName, startTaskCount, 3);
        endRollingCount(this);
    });


    test("Disable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks." + testsName, false, tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, 0);
        endRollingCount(this);
    });


    test("Re-enable", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.tasks.count.verify);
        await executeSettingsUpdate("enabledTasks." + testsName, true, tc.waitTime.config.enableEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Create Empty Directory", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createFolderEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.createDir(dirName);
        await waitForTeIdle(tc.waitTime.fs.createFolderEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(fileUri.fsPath, "#!/usr/local/bin/python\n\n");
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 1);
        endRollingCount(this);
    });


    test("Delete File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteFile(fileUri.fsPath);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Re-create File", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.createEvent + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.writeFile(fileUri.fsPath, "#!/usr/local/bin/python\n\n");
        await waitForTeIdle(tc.waitTime.fs.createEvent);
        await verifyTaskCount(testsName, startTaskCount + 1, 1);
        endRollingCount(this);
    });


    test("Delete Folder", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.fs.deleteFolderEvent + (tc.waitTime.fs.deleteEvent * 2) + tc.slowTime.tasks.count.verify);
        await teWrapper.fs.deleteDir(dirName);
        await waitForTeIdle(tc.waitTime.fs.deleteEvent * 2);
        await verifyTaskCount(testsName, startTaskCount);
        endRollingCount(this);
    });


    test("Enable / Disable Filename Stripdown in Grouping Item Label", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.config.enableEvent + tc.slowTime.config.disableEvent + (tc.slowTime.tasks.getTreeTasks * 2));
        await executeSettingsUpdate(teWrapper.keys.Config.GroupStripScriptLabel, true);
        await waitForTeIdle(tc.waitTime.min);
        let python = await getTreeTasks(teWrapper, "python", 5);
        expect(!!python.find(p => p.label === "py-grp-test-one.py")).to.be.equal(false);
        expect(!!python.find(p => p.label === "one.py")).to.be.equal(true);
        await executeSettingsUpdate(teWrapper.keys.Config.GroupStripScriptLabel, false);
        await waitForTeIdle(tc.waitTime.min);
        python = await getTreeTasks(teWrapper, "python", 5);
        expect(!!python.find(p => p.label === "py-grp-test-one.py")).to.be.equal(true);
        expect(!!python.find(p => p.label === "one.py")).to.be.equal(false);
        endRollingCount(this);
    });

});

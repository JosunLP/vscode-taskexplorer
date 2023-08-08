
import { join } from "path";
import fsUtils from "../../utils/fsUtils";
import { refresh } from "../../utils/treeUtils";
import { startupBuildTree } from "../../utils/suiteUtils";
import { ITaskExplorerApi, ITeWrapper } from ":types";
import { executeTeCommand } from "../../utils/commandUtils";
import { ExternalTaskProvider1 } from "./externalProvider1";
import { ExternalTaskProvider2 } from "./externalProvider2";
import { ExternalTaskProvider3 } from "./externalProvider3";
import { Uri, workspace, WorkspaceFolder, tasks, Disposable } from "vscode";
import {
    activate, endRollingCount, exitRollingCount, getProjectsPath, getWsPath, suiteFinished, testControl,
    verifyTaskCount, waitForTeIdle
} from "../../utils/utils";

let teApi: ITaskExplorerApi;
let teWrapper: ITeWrapper;
let dispose: Disposable;
let dispose2: Disposable;
let dispose3: Disposable;
let insideWsDir: string;
let outsideWsDir: string;
let taskProvider: ExternalTaskProvider1;
let taskProvider2: ExternalTaskProvider2;
let taskProvider3: ExternalTaskProvider3;


suite("External Provider Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper, teApi } = await activate());
        insideWsDir = getWsPath("tasks_test_");
        outsideWsDir = getProjectsPath("testA");
        taskProvider = new ExternalTaskProvider1();
        taskProvider2 = new ExternalTaskProvider2();
        taskProvider3 = new ExternalTaskProvider3();
        dispose = tasks.registerTaskProvider("external", taskProvider);
        dispose2 = tasks.registerTaskProvider("external2", taskProvider2);
        dispose3 = tasks.registerTaskProvider("external3", taskProvider3);
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        dispose?.dispose();
        dispose2?.dispose();
        dispose3?.dispose();
        await fsUtils.deleteDir(insideWsDir);
        await fsUtils.deleteDir(outsideWsDir);
        suiteFinished(this);
    });


    test("Build Tree", async function()
    {
        await startupBuildTree(teWrapper, this);
    });


    test("Get API", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.commands.fast + 75);
        teApi = await executeTeCommand<ITaskExplorerApi>("taskexplorer.getApi");
        endRollingCount(this);
    });


    test("Register External Task Provider 1", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.waitTime.config.enableEvent + testControl.slowTime.tasks.count.verify);
        taskProvider.getDocumentPosition("test_1_task_name", "test_1_task_name");
        await teApi.register("external", taskProvider, "");
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
        await verifyTaskCount("external", 2);
        endRollingCount(this);
    });


    test("Register External Task Provider 2", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.waitTime.config.enableEvent + testControl.slowTime.tasks.count.verify);
        await teApi.register("external2", taskProvider2, "");
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
        await verifyTaskCount("external2", 2);
        endRollingCount(this);
    });


    test("Register External Task Provider 3", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.waitTime.config.enableEvent + testControl.slowTime.tasks.count.verify);
        await teApi.register("external3", taskProvider3, "");
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
        await verifyTaskCount("external3", 2);
        endRollingCount(this);
    });


    test("Access External Task Provider 1", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent);
        const provider = teApi.providers.external as ExternalTaskProvider1;
        const task = provider.createTask("test", "test", (workspace.workspaceFolders as WorkspaceFolder[])[0], Uri.file("dummy_path"));
        provider.getDocumentPosition("test_1_task_name", "test_1_task_name");
        provider.resolveTask(task);
        endRollingCount(this);
    });


    test("Access External Task Provider 2", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent);
        const task = taskProvider2.createTask("test", "test", (workspace.workspaceFolders as WorkspaceFolder[])[0], Uri.file("dummy_path"));
        try {
            taskProvider2.resolveTask(task);
        } catch {}
        try {
            taskProvider2.provideTasks();
        } catch {}
        endRollingCount(this);
    });


    test("Refresh External Task Provider 1", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.commands.refreshNoChanges + testControl.slowTime.tasks.count.verify);
        await teApi.refreshExternalProvider("external", "");
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
        await verifyTaskCount("external", 2);
        endRollingCount(this);
    });


    test("Refresh External Task Provider 2", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.commands.refreshNoChanges + testControl.slowTime.tasks.count.verify);
        await teApi.refreshExternalProvider("external2", "");
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
        await verifyTaskCount("external2", 2);
        endRollingCount(this);
    });


    test("Refresh External Task Provider 3", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.commands.refreshNoChanges + testControl.slowTime.tasks.count.verify);
        await teApi.refreshExternalProvider("external3", "");
        await waitForTeIdle(testControl.waitTime.config.enableEvent);
        await verifyTaskCount("external3", 2);
        endRollingCount(this);
    });


    test("Unregister External Task Provider 1", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.waitTime.config.event + testControl.slowTime.tasks.count.verify);
        await teApi.unregister("external", "");
        await waitForTeIdle(testControl.waitTime.config.event);
        await verifyTaskCount("external", 0);
        endRollingCount(this);
    });


    test("Unregister External Task Provider 2", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.waitTime.config.event + testControl.slowTime.tasks.count.verify);
        await teApi.unregister("external2", "");
        await waitForTeIdle(testControl.waitTime.config.event);
        await verifyTaskCount("external2", 0);
        endRollingCount(this);
    });


    test("Add a Non-Empty Folder to Workspace Folder", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow((testControl.slowTime.fs.createFolderEvent * 2) + testControl.slowTime.fs.createEvent + (testControl.slowTime.tasks.count.verify * 2));
        await fsUtils.createDir(outsideWsDir);
        await fsUtils.createFile(join(outsideWsDir, "Somefile.js"), "a = {\na: b\n};\n");
        await teWrapper.fs.copyDir(outsideWsDir, insideWsDir, /Somefile\.js/, true); // copy folder
        await waitForTeIdle(testControl.waitTime.fs.createFolderEvent);
        endRollingCount(this);
    });


    test("Delete New Non-Empty Folder", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.fs.deleteFolderEvent + testControl.slowTime.tasks.count.verify);
        await fsUtils.deleteDir(join(insideWsDir, "testA"));
        await waitForTeIdle(testControl.waitTime.fs.deleteFolderEvent);
        endRollingCount(this);
    });


    test("Refresh Tree", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.commands.refresh + testControl.slowTime.tasks.count.verify);
        await refresh(teWrapper);
        await verifyTaskCount("external3", 2);
        endRollingCount(this);
    });


    test("Unregister External Task Provider 3", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(testControl.slowTime.config.enableEvent + testControl.waitTime.config.event + testControl.slowTime.tasks.count.verify);
        await teApi.unregister("external3", "");
        await waitForTeIdle(testControl.waitTime.config.event);
        await verifyTaskCount("external3", 0);
        endRollingCount(this);
    });


    test("Refresh Non-Existent External Task Provider", async function()
    {
        if (exitRollingCount(this)) return;
        await teApi.refreshExternalProvider("external_no_exist", ""); // cover
        endRollingCount(this);
    });

});

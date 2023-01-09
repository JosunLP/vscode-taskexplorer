/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* tslint:disable */

//
// Documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as path from "path";
import TaskItem from "../../tree/item";
import TaskFile from "../../tree/file";
import constants from "../../lib/constants";
import { expect } from "chai";
import { workspace, tasks, Uri, WorkspaceFolder } from "vscode";
import { removeFromArray } from "../../lib/utils/utils";
import { ITaskExplorerApi, IExplorerApi, TaskMap, IFilesystemApi } from "@spmeesseman/vscode-taskexplorer-types";
import {
    activate, executeSettingsUpdate, executeTeCommand, executeTeCommand2,
    focusExplorer, getWsPath, sleep, testControl, treeUtils, verifyTaskCount
} from "../helper";


const tempFiles: string[] = [];

let teApi: ITaskExplorerApi;
let fsApi: IFilesystemApi;
let explorer: IExplorerApi;
let rootPath: string;
let dirName: string;
let dirNameL2: string;
let ws2DirName: string;
let dirNameIgn: string;
let batch: TaskItem[];
let taskMap: TaskMap;


suite("Provider Tests", () =>
{

    suiteSetup(async function()
    {
        teApi = await activate(this);
        explorer = teApi.testsApi.explorer;
        fsApi = teApi.testsApi.fs;

        rootPath = getWsPath(".");
        dirName = path.join(rootPath, "tasks_test_");
        dirNameL2 = path.join(dirName, "subfolder");
        ws2DirName = path.join(rootPath, "ws2");
        dirNameIgn = path.join(rootPath, "tasks_test_ignore_");
        //
        // Add some excludes, use both config update and task explorer addExclude command
        // for full coverage.  The 'addExclude' command will add the setting globally though,
        // so add it to the workspace setting as well
        //
        await executeSettingsUpdate("exclude", [ "**/tasks_test_ignore_/**", "**/ant/**" ]);
        await executeTeCommand2("addToExcludes", [ "**/tasks_test_ignore_/**" ]);

    });


    suiteTeardown(async function()
    {
        await executeSettingsUpdate("logging.enable", testControl.logEnabled);
        await executeSettingsUpdate("specialFolders.expanded.test-files", false);
    });


    test("Create Temporary Directories", async function()
    {
        this.slow(10000);
         //
        // Create the temporary project dirs
        //
        if (!await fsApi.pathExists(dirName)) {
            await fsApi.createDir(dirName);
        }
        if (!await fsApi.pathExists(dirNameL2)) {
            await fsApi.createDir(dirNameL2);
        }
        if (!await fsApi.pathExists(ws2DirName)) {
            await fsApi.createDir(ws2DirName);
        }
        if (!await fsApi.pathExists(dirNameIgn)) {
            await fsApi.createDir(dirNameIgn);
        }

        //
        // New Workspace folders
        //
        let wsDirName = path.join(rootPath, "newA");
        if (!await fsApi.pathExists(wsDirName)) {
            await fsApi.createDir(wsDirName);
        }
        wsDirName = path.join(rootPath, "newB");
        if (!await fsApi.pathExists(wsDirName)) {
            await fsApi.createDir(wsDirName);
        }
        wsDirName = path.join(rootPath, "newC");
        if (!await fsApi.pathExists(wsDirName)) {
            await fsApi.createDir(wsDirName);
        }
        wsDirName = path.join(rootPath, "newD");
        if (!await fsApi.pathExists(wsDirName)) {
            await fsApi.createDir(wsDirName);
        }

        const wsf: WorkspaceFolder[] = [
        {
            uri: Uri.parse(ws2DirName),
            name: "ws2",
            index: 1
        },
        {
            uri: Uri.parse(path.join(rootPath, "newC")),
            name: "C Test Workspace",
            index: 2
        },
        {
            uri: Uri.parse(path.join(rootPath, "newB")),
            name: "B Test Workspace",
            index: 3
        },
        {
            uri: Uri.parse(path.join(rootPath, "newA")),
            name: "A Test Workspace",
            index: 4
        },
        {
            uri: Uri.parse(path.join(rootPath, "newD")),
            name: "D Test Workspace",
            index: 5
        }];

        //
        // Merge VSCode ws folders
        //
        (workspace.workspaceFolders as WorkspaceFolder[]).concat(wsf);

        await teApi.waitForIdle(3000);
    });


    test("Build Tree (View Collapsed)", async function()
    {
        if (!explorer.isVisible()) {
            await treeUtils.buildTree(this);
        }
    });


    test("Check Existing Bash Task Counts", async function()
    {
        this.slow(testControl.slowTime.command);
        batch = await treeUtils.getTreeTasks("bash", 1);
    });


    test("Check Existing Batch Task Counts", async function()
    {
        this.slow(testControl.slowTime.command);
        batch = await treeUtils.getTreeTasks("batch", 2);
    });


    test("Create Temporary Task Files - App Publisher", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupAppPublisher();
    });


    test("Create Temporary Task Files - Ant", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupAnt();
    });


    test("Create Temporary Task Files - Bash", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupBash();
    });


    test("Create Temporary Task Files - Batch", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupBatch();
    });


    test("Create Temporary Task Files - Gradle", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupGradle();
    });


    test("Create Temporary Task Files - Grunt", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupGrunt();
    });


    test("Create Temporary Task Files - Gulp", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupGulp();
    });


    test("Create Temporary Task Files - Makefile", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupMakefile();
    });


    test("Create Temporary Task Files - Maven", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupMaven();
    });


    test("Create Temporary Task Files - Typescript", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent);
        await setupTsc();
    });


	test("Focus Task Explorer View for Tree Population", async function()
	{
        await focusExplorer(this);
	});


    test("Enable App-Publisher Tasks (Off by Default)", async function()
    {
        this.slow(testControl.slowTime.configEnableEvent);
        await executeSettingsUpdate("enabledTasks.apppublisher", true);
    });


    test("Enable Pipenv Tasks (Off by Default)", async function()
    {
        this.slow(testControl.slowTime.configEnableEvent);
        await executeSettingsUpdate("enabledTasks.pipenv", true);
    });


    test("Enable Python Tasks (Turned Off in Configuration Suite)", async function()
    {
        this.slow(testControl.slowTime.configEnableEvent);
        await executeSettingsUpdate("enabledTasks.python", true);
    });


    test("Enable Maven Tasks (Off by Default)", async function()
    {
        this.slow(testControl.slowTime.configEnableEvent);
        await executeSettingsUpdate("enabledTasks.maven", true);
    });


    test("Build Tree", async function()
    {
        await treeUtils.buildTree(this);
        //
        // Check VSCode provided task types for the hell of it
        //
        let nTasks = await tasks.fetchTasks({ type: "grunt" });
        assert(nTasks.length > 0, "No grunt tasks registered");
        nTasks = await tasks.fetchTasks({ type: "gulp" });
        assert(nTasks.length > 0, "No gulp tasks registered");
        batch = await treeUtils.getTreeTasks("batch", 4);
    });


    test("Build Tree Variations  - Last Tasks Collapsed", async function()
    {
        this.slow(1250);
        const showFavorites = teApi.config.get<boolean>("specialFolders.showFavorites");
        const showLastTasks = teApi.config.get<boolean>("specialFolders.showLastTasks");
        try {
            await executeSettingsUpdate("specialFolders.showFavorites", true);
            await executeSettingsUpdate("specialFolders.showLastTasks", true);
            await executeSettingsUpdate("specialFolders.expanded.lastTasks", false);
            expect(await explorer.buildTaskTree([], "   ", 5)).to.be.an("array").that.has.a.lengthOf(1); // (No Scripts)
            expect(await explorer.buildTaskTree([], "   ", 5, true)).to.be.an("array").that.has.a.lengthOf(2);
        }
        catch (e) {
            throw e;
        }
        finally {
            await executeSettingsUpdate("specialFolders.expanded.lastTasks", true);
            await executeSettingsUpdate("specialFolders.showFavorites", showFavorites);
            await executeSettingsUpdate("specialFolders.showLastTasks", showLastTasks);
        }
    });


    test("Build Tree Variations - Favorites Collapsed", async function()
    {
        this.slow(1250);
        const showFavorites = teApi.config.get<boolean>("specialFolders.showFavorites");
        const showLastTasks = teApi.config.get<boolean>("specialFolders.showLastTasks");
        try {
            await executeSettingsUpdate("specialFolders.showFavorites", true);
            await executeSettingsUpdate("specialFolders.showLastTasks", true);
            await executeSettingsUpdate("specialFolders.expanded.favorites", false);
            expect(await explorer.buildTaskTree([], "   ", 5)).to.be.an("array").that.has.a.lengthOf(1); // (No Scripts)
            expect(await explorer.buildTaskTree([], "   ", 5, true)).to.be.an("array").that.has.a.lengthOf(2);
        }
        catch (e) {
            throw e;
        }
        finally {
            await executeSettingsUpdate("specialFolders.expanded.favorites", true);
            await executeSettingsUpdate("specialFolders.showLastTasks", showLastTasks);
            await executeSettingsUpdate("specialFolders.showFavorites", showFavorites);
        }
    });


    test("Build Tree Variations - Favorites Disabled", async function()
    {
        this.slow(1250);
        const showFavorites = teApi.config.get<boolean>("specialFolders.showFavorites");
        const showLastTasks = teApi.config.get<boolean>("specialFolders.showLastTasks");
        try {
            await executeSettingsUpdate("specialFolders.showFavorites", false);
            await executeSettingsUpdate("specialFolders.showLastTasks", true);
            await executeSettingsUpdate("specialFolders.expanded.favorites", false);
            await executeSettingsUpdate("specialFolders.expanded.lastTasks", false);
            expect(await explorer.buildTaskTree([], "   ", 5)).to.be.an("array").that.has.a.lengthOf(1); // (No Scripts)
            expect(await explorer.buildTaskTree([], "   ", 5, true)).to.be.an("array").that.has.a.lengthOf(1);
        }
        catch (e) {
            throw e;
        }
        finally {
            await executeSettingsUpdate("specialFolders.expanded.favorites", true);
            await executeSettingsUpdate("specialFolders.expanded.lastTasks", true);
            await executeSettingsUpdate("specialFolders.showLastTasks", showLastTasks);
            await executeSettingsUpdate("specialFolders.showFavorites", showFavorites);
        }
    });


    test("Build Tree Variations - Last Tasks Disabled", async function()
    {
        this.slow(1250);
        const showFavorites = teApi.config.get<boolean>("specialFolders.showFavorites");
        const showLastTasks = teApi.config.get<boolean>("specialFolders.showLastTasks");
        try {
            await executeSettingsUpdate("specialFolders.showFavorites", true);
            await executeSettingsUpdate("specialFolders.showLastTasks", false);
            await executeSettingsUpdate("specialFolders.expanded.favorites", false);
            expect(await explorer.buildTaskTree([], "   ", 5)).to.be.an("array").that.has.a.lengthOf(1); // (No Scripts)
            expect(await explorer.buildTaskTree([], "   ", 5, true)).to.be.an("array").that.has.a.lengthOf(1);
        }
        catch (e) {
            throw e;
        }
        finally {
            await executeSettingsUpdate("specialFolders.expanded.favorites", true);
            await executeSettingsUpdate("specialFolders.showLastTasks", showLastTasks);
            await executeSettingsUpdate("specialFolders.showFavorites", showFavorites);
        }
    });


    test("Open Tasks for Edit", async function()
    {   //
        // The 3rd param `true` will open the task files and locate task positions while parsing the tree
        //
        this.slow(testControl.slowTime.walkTaskTreeWithDocOpen);
        taskMap = await treeUtils.walkTreeItems(undefined, true);
        checkTasks(7, 42, 3, 4, 3, 13, 32, 2, 4, 10);
    });


    test("Resolve Task", async function()
    {
        const provider = teApi.providers.get("batch");
        assert(provider);
        provider.resolveTask(batch[0]);
    });


    test("Add to Excludes - TaskItem", async function()
    {
        this.slow(testControl.slowTime.fetchTasksCommand + testControl.slowTime.command);
        const taskItems = await tasks.fetchTasks({ type: "grunt" }),
              gruntCt = taskItems.length;
        for (const taskItem of Object.values(taskMap))
        {
            const value = taskItem as TaskItem;
            if (value.taskSource === "grunt" && !value.taskFile.path.startsWith("grunt"))
            {
                const node = value.taskFile.treeNodes.find(
                    n => n instanceof TaskItem && n.task.name && n.task.name.includes("upload2")
                ) as TaskItem;
                if (node)
                {
                    await executeTeCommand("addToExcludes", testControl.waitTime.configEvent, 3000, node);
                    break;
                }
            }
        }
        await verifyTaskCount("grunt", gruntCt - 1);
    });


    test("Add to Excludes - TaskItem (Script Type)", async function()
    {
        this.slow(1000);
        const taskItems = await tasks.fetchTasks({ type: "batch" }),
              scriptCt = taskItems.length;
        for (const property in taskMap)
        {
            if ({}.hasOwnProperty.call(taskMap, property))
            {
                const value= taskMap[property];
                if (value && value.taskSource === "batch" && value.taskFile.fileName.toLowerCase().includes("test2.bat"))
                {
                    const node = value.taskFile.treeNodes.find(
                        n => n instanceof TaskItem && n.task.name && n.task.name.toLowerCase().includes("test2.bat")
                    ) as TaskItem;
                    if (node)
                    {
                        await executeTeCommand("addToExcludes", 500, 3000, node);
                        break;
                    }
                }
            }
        }
        await verifyTaskCount("batch", scriptCt - 1);
    });


    test("Add to Excludes - TaskFile", async function()
    {
        this.slow(testControl.slowTime.fetchTasksCommand + (testControl.slowTime.command * 2));
        const taskItems = await tasks.fetchTasks({ type: "grunt" }),
              gruntCt = taskItems.length;
        for (const property in taskMap)
        {
            if ({}.hasOwnProperty.call(taskMap, property))
            {
                const value= taskMap[property];
                if (value && value.taskSource === "grunt" && !value.taskFile.path.startsWith("grunt"))
                {
                    await executeTeCommand2("addToExcludes", [ value.taskFile ], testControl.waitTime.command);
                    break;
                }
            }
        }
        await verifyTaskCount("grunt", gruntCt - 2);
    });


    test("Add to Excludes - Bad Call", async function()
    {
        this.slow(testControl.slowTime.command);
        await executeTeCommand("addToExcludes", testControl.waitTime.command);
    });


    test("App Publisher Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent + (testControl.slowTime.fetchTasksCommand * 2));
        const file = path.join(rootPath, ".publishrc.json");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent);
        await verifyTaskCount("apppublisher", 21);
        await createAppPublisherFile();
        await verifyTaskCount("apppublisher", 42);
    });


    test("Ant Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent);
        const file = path.join(dirName, "build.xml");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent, 1500);
        await createAntFile();
    });


    test("Gradle Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent);
        const file = path.join(dirName, "build.gradle");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent, 1500);
        await createGradleFile();
    });


    test("Grunt Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent);
        const file = path.join(rootPath, "GRUNTFILE.js");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent, 1500);
        await createGruntFile();
    });


    test("Gulp Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent);
        const file = path.join(rootPath, "gulpfile.js");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent, 1500);
        await createGulpFile();
    });


    test("Makefile Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent + testControl.slowTime.configEvent);
        const file = path.join(rootPath, "Makefile");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent, 1500);
        await createMakeFile();
        await teApi.config.updateWs("logging.enable", true); // hit tree.logTask()
    });


    test("Maven Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent);
        const file = path.join(rootPath, "pom.xml");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent, 1500);
        await createMavenPomFile();
    });


    test("Batch Delete / Add", async function()
    {
        this.slow(testControl.slowTime.fsCreateEvent + testControl.slowTime.fsDeleteEvent);
        const file = path.join(rootPath, "test.bat");
        removeFromArray(tempFiles, file);
        await fsApi.deleteFile(file);
        await teApi.waitForIdle(testControl.waitTime.fsDeleteEvent, 1500);
        await createBatchFile();
    });


    test("Add WS Folder to File Cache", async function()
    {
        this.slow(testControl.slowTime.refreshCommand + (testControl.slowTime.fsCreateEvent * 2));
        await executeSettingsUpdate("enabledTasks.pipenv", false);
        await teApi.testsApi.fileCache.addWsFolders();
        await teApi.testsApi.fileCache.addWsFolders(workspace.workspaceFolders as WorkspaceFolder[]);
        await teApi.waitForIdle(2500, testControl.slowTime.refreshCommand + 5000);
    });


    test("Run Refresh Task", async function()
    {
        this.slow(testControl.slowTime.refreshCommand + (testControl.slowTime.configEvent * 2));
        await executeSettingsUpdate("specialFolders.expanded.test-files", true);
        await executeTeCommand("refresh");
        await executeSettingsUpdate("logging.enable", false); // was hitting tree.logTask()
    });


    test("Invalidate Bash Tasks With New Bash Shell Setting", async function()
    {
        this.slow(testControl.slowTime.buildFileCache + (testControl.slowTime.configEvent * 2));
        if (!teApi || !teApi.explorer || !workspace.workspaceFolders) {
            assert.fail("        ✘ Task Explorer tree instance does not exist");
        }
        await teApi.config.updateVsWs("terminal.integrated.shell.windows",
                                       "C:\\Program Files\\Git\\bin\\bash.exe");
        await teApi.waitForIdle(testControl.waitTime.configEvent, 1000);
        await teApi.testsApi.fileCache.buildCache("bash", constants.GLOB_BASH, workspace.workspaceFolders[0], true);
        await teApi.waitForIdle();
        await executeSettingsUpdate("specialFolders.expanded.test-files", false);
    });


    test("Rebuild Gulp FileCache on Single Workspace Folder", async function()
    {
        this.slow(testControl.slowTime.buildFileCache);
        if (!teApi || !teApi.explorer || !workspace.workspaceFolders) {
            assert.fail("        ✘ Task Explorer tree instance does not exist");
        }
        await teApi.testsApi.fileCache.buildCache("gulp",constants.GLOB_GULP, workspace.workspaceFolders[0], true);
        await teApi.waitForIdle();
    });


    test("Groups with Separator", async function()
    {
        this.slow(testControl.slowTime.configGroupingEvent * 3);
        await executeSettingsUpdate("groupWithSeparator", true);
        await executeSettingsUpdate("groupSeparator", "-");
        await executeSettingsUpdate("groupMaxLevel", 5);
    });


    test("Add to Excludes After Grouping", async function()
    {
        this.slow(testControl.slowTime.configExcludesEvent);

        const taskItemsB4 = await tasks.fetchTasks({ type: "grunt" }),
              gruntCt = taskItemsB4.length;

        for (const taskItem of Object.values(taskMap))
        {
            if (taskItem && taskItem.taskSource === "grunt")
            {
                let taskFile = taskItem.taskFile;
                while (taskFile.treeNodes.length === 1 && taskFile.treeNodes[0] instanceof TaskFile && !taskFile.isGroup)
                {
                    taskFile = taskFile.treeNodes[0];
                }
                if (taskFile && taskFile.isGroup && !taskItem.taskFile.path.startsWith("grunt"))
                {
                    await executeTeCommand2("addToExcludes", [ taskFile ]);
                    break;
                }
            }
        }

        const taskItems = await tasks.fetchTasks({ type: "grunt" });
        if (taskItems.length !== gruntCt - 2) { // grunt file that just got ignored had 7 tasks
            assert.fail("Unexpected grunt task count (Found " + taskItems.length + " of " +
                        (gruntCt - 2).toString() + ")");
        }
    });


    test("Cancel Rebuild Cache (Not Busy)", async function()
    {
        await teApi.testsApi.fileCache.cancelBuildCache();
    });


    test("Cancel Rebuild Cache (Busy No Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await teApi.testsApi.fileCache.cancelBuildCache();
        await sleep(25);
    });


    test("Cancel Rebuild Cache (Busy 40ms Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel + 40 + 25);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await sleep(40);
        await teApi.testsApi.fileCache.cancelBuildCache();
        await sleep(25);
    });


    test("Cancel Rebuild Cache (Busy 75ms Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel + 75 + 25);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await sleep(75);
        await teApi.testsApi.fileCache.cancelBuildCache();
        await sleep(25);
    });


    test("Cancel Rebuild Cache (Busy 100ms Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel + 100 + 25);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await sleep(100);
        await teApi.testsApi.fileCache.cancelBuildCache("");
        await teApi.testsApi.fileCache.rebuildCache();
        await sleep(25);
    });


    test("Cancel Rebuild Cache (Busy 250ms Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel + 250 + 25);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await sleep(250);
        await teApi.testsApi.fileCache.cancelBuildCache("");
        await teApi.testsApi.fileCache.rebuildCache();
        await sleep(25);
    });


    test("Cancel Rebuild Cache (Busy 500ms Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel + 500 + 25);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await sleep(500);
        await teApi.testsApi.fileCache.cancelBuildCache("");
        await teApi.testsApi.fileCache.rebuildCache();
        await sleep(25);
    });


    test("Cancel Rebuild Cache (Busy 750ms Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel + 750 + 25);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await sleep(750);
        await teApi.testsApi.fileCache.cancelBuildCache("");
        await teApi.testsApi.fileCache.rebuildCache();
        await sleep(25);
    });


    test("Cancel Rebuild Cache (Busy 1s Delay)", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCacheCancel + 1000 + 25);
        teApi.testsApi.fileCache.rebuildCache(""); // Don't 'await'
        await sleep(1000);
        await teApi.testsApi.fileCache.cancelBuildCache("");
        await teApi.testsApi.fileCache.rebuildCache();
        await sleep(25);
    });


    test("Rebuild Cache After Cancel", async function()
    {
        this.slow(testControl.slowTime.rebuildFileCache + 25);
        await teApi.testsApi.fileCache.rebuildCache();
        await sleep(25);
    });


    test("Mimic Add/Remove a Workspace Folder", async function()
    {
        await teApi.testsApi.fileCache.addWsFolders(workspace.workspaceFolders);
        teApi.testsApi.fileCache.removeWsFolders((workspace.workspaceFolders as WorkspaceFolder[]).filter(f =>  f.index > 0));
    });


    test("Remove Temporary Directories", async function()
    {
        this.slow(testControl.slowTime.fsDeleteFolderEvent * 8 + (testControl.slowTime.fsDeleteEvent * 2));
        if (tempFiles.length)
        {
            let file: string | undefined;
            while ((file = tempFiles.shift()))
            {
                try {
                    await fsApi.deleteFile(file);
                }
                catch (error) {
                    console.log(error);
                }
            }
        }

        if (dirName && ws2DirName && dirNameIgn && dirNameL2)
        {
            try {
                await fsApi.deleteDir(ws2DirName);
                await fsApi.deleteDir(dirNameL2);
                await fsApi.deleteDir(dirName);
                await fsApi.deleteDir(dirNameIgn);
            }
            catch (error) {
                console.log(error);
            }
        }

        //
        // Workspace folders
        //
        try {
            let wsDirName = path.join(rootPath, "newA");
            if (await fsApi.pathExists(wsDirName)) {
                await fsApi.deleteDir(wsDirName);
            }
            wsDirName = path.join(rootPath, "newB");
            if (await fsApi.pathExists(wsDirName)) {
                await fsApi.deleteDir(wsDirName);
            }
            wsDirName = path.join(rootPath, "newC");
            if (await fsApi.pathExists(wsDirName)) {
                await fsApi.deleteDir(wsDirName);
            }
            wsDirName = path.join(rootPath, "newD");
            if (await fsApi.pathExists(wsDirName)) {
                await fsApi.deleteDir(wsDirName);
            }
        }
        catch(error) {
            console.log(error);
        }

        await teApi.waitForIdle(3000);
    });

});


function checkTasks(ant: number, ap: number, bash: number, bat: number, gradle: number, grunt: number, gulp: number, python: number, tsc: number, vsc: number)
{
    console.log("    Task Counts");

    let taskCount = treeUtils.findIdInTaskMap(":ant", taskMap);
    console.log("      Ant           : " + taskCount.toString());
    if (taskCount !== ant) {
        assert.fail(`Unexpected Ant task count (Found ${taskCount} of ${ant})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":apppublisher:", taskMap);
    console.log("      App-Publisher : " + taskCount.toString());
    if (taskCount !== ap) {
        assert.fail(`Unexpected AppPublisher task count (Found ${taskCount} of ${ap})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":bash:", taskMap);
    console.log("      Bash          : " + taskCount.toString());
    if (taskCount !== bash) {
        assert.fail(`Unexpected Bash task count (Found ${taskCount} of ${bash})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":batch:", taskMap);
    console.log("      Batch         : " + taskCount.toString());
    if (taskCount !== bat) {
        assert.fail(`Unexpected Batch task count (Found ${taskCount} of ${bat})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":gradle:", taskMap);
    console.log("      Gradle        : " + taskCount.toString());
    if (taskCount !== gradle) {
        assert.fail(`Unexpected Gradle task count (Found ${taskCount} of ${gradle})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":grunt:", taskMap);
    console.log("      Grunt         : " + taskCount.toString());
    if (taskCount !== grunt) {
        assert.fail(`Unexpected Grunt task count (Found ${taskCount} of ${grunt})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":gulp:", taskMap);
    console.log("      Gulp          : " + taskCount.toString());
    if (taskCount !== gulp) {
        assert.fail(`Unexpected Gulp task count (Found ${taskCount} of ${gulp})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":python:", taskMap);
    console.log("      Python        : " + taskCount.toString());
    if (taskCount !== python) {
        assert.fail(`Unexpected Python task count (Found ${taskCount} of ${python})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":tsc:", taskMap);
    console.log("      TypeScript    : " + taskCount.toString());
    if (taskCount !== tsc) {
        assert.fail(`Unexpected Typescript task count (Found ${taskCount} of ${tsc})`);
    }

    taskCount = treeUtils.findIdInTaskMap(":Workspace:", taskMap);
    console.log("      VSCode        : " + taskCount.toString());
    if (taskCount !== vsc) {
        assert.fail(`Unexpected VSCode task count (Found ${taskCount} of ${vsc})`);
    }
}


async function setupAnt()
{
    if (!rootPath || !dirNameIgn || !dirName) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    await createAntFile();

    const file2 = path.join(dirName, "test.xml");
    const file3 = path.join(dirName, "emptytarget.xml");
    const file4 = path.join(dirName, "emptyproject.xml");
    const file5 = path.join(dirNameIgn, "build.xml");

    tempFiles.push(file2);
    tempFiles.push(file3);
    tempFiles.push(file4);
    tempFiles.push(file5);

    await fsApi.writeFile(
        file2,
        '<?xml version="1.0"?>\n' +
        '<project basedir="." default="test2">\n' +
        '    <property name="test2" value="test2" />\n' +
        "    <target name='test3'></target>\n" +
        '    <target name="test4"></target>\n' +
        "</project>\n"
    );

    await fsApi.writeFile(
        file3,
        '<?xml version="1.0"?>\n' +
        '<project basedir="." default="test1">\n' +
        '    <property environment="env" />\n' +
        '    <property name="test" value="test" />\n' +
        "</project>\n"
    );

    await fsApi.writeFile(file4, '<?xml version="1.0"?>\n');

    await fsApi.writeFile(
        file5,
        '<?xml version="1.0"?>\n' +
        '<project basedir="." default="test2">\n' +
        '    <property name="testv" value="testv" />\n' +
        "    <target name='test5'></target>\n" +
        "</project>\n"
    );

    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
}


async function setupGradle()
{
    if (!rootPath || !dirNameIgn || !dirName) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    await createGradleFile();

    const file2 = path.join(dirName, "TEST.GRADLE");
    const file3 = path.join(dirNameIgn, "build.gradle");

    tempFiles.push(file2);
    tempFiles.push(file3);

    await fsApi.writeFile(
        file2,
        "task fatJar2(type: Jar) {\n" +
        "    manifest {\n" +
        "        attributes 'Implementation-Title': 'Gradle Jar File Example',\n" +
        "            'Implementation-Version': version,\n" +
        "            'Main-Class': 'com.spmeesseman.test'\n" +
        "    }\n" +
        "    baseName = project.name + '-all'\n" +
        "    from { configurations.compile.collect { it.isDirectory() ? it : zipTree(it) } }\n" +
        "    with jar\n" +
        "}\n"
    );

    await fsApi.writeFile(
        file3,
        "task fatJar3(type: Jar) {\n" +
        "    manifest {\n" +
        "        attributes 'Implementation-Title': 'Gradle Jar File Example',\n" +
        "            'Implementation-Version': version,\n" +
        "            'Main-Class': 'com.spmeesseman.test'\n" +
        "    }\n" +
        "    baseName = project.name + '-all'\n" +
        "    from { configurations.compile.collect { it.isDirectory() ? it : zipTree(it) } }\n" +
        "    with jar\n" +
        "}\n"
    );

    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
}


async function setupTsc()
{
    if (!rootPath || !dirName) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    const file = path.join(rootPath, "tsconfig.json");
    tempFiles.push(file);
    const file2 = path.join(dirName, "tsconfig.json");
    tempFiles.push(file2);

    await fsApi.writeFile(
        file,
        "{\n" +
        '    "compilerOptions":\n' +
        "  {\n" +
        '    "target": "es6",\n' +
        '    "lib": ["es2016"],\n' +
        '    "module": "commonjs",\n' +
        '    "outDir": "./out",\n' +
        '    "typeRoots": ["./node_modules/@types"],\n' +
        '    "strict": true,\n' +
        '    "experimentalDecorators": true,\n' +
        '    "sourceMap": true,\n' +
        '    "noImplicitThis": false\n' +
        "  },\n" +
        '  "include": ["**/*"],\n' +
        '  "exclude": ["node_modules"]\n' +
        "}\n"
    );

    await fsApi.writeFile(
        file2,
        "{\n" +
        '    "compilerOptions":\n' +
        "  {\n" +
        '    "target": "es6",\n' +
        '    "lib": ["es2016"],\n' +
        '    "module": "commonjs",\n' +
        '    "outDir": "./out",\n' +
        '    "typeRoots": ["./node_modules/@types"],\n' +
        '    "strict": true,\n' +
        '    "experimentalDecorators": true,\n' +
        '    "sourceMap": true,\n' +
        '    "noImplicitThis": false\n' +
        "  },\n" +
        '  "include": ["**/*"],\n' +
        '  "exclude": ["node_modules"]\n' +
        "}\n"
    );

    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
}


async function setupGulp()
{
    if (!rootPath || !dirNameIgn || !dirName || !dirNameL2) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    await createGulpFile();

    const file2 = path.join(dirName, "Gulpfile.js");
    tempFiles.push(file2);

    const file3 = path.join(dirNameIgn, "gulpfile.js");
    tempFiles.push(file3);

    const file4 = path.join(dirName, "GULPFILE.MJS");
    tempFiles.push(file4);

    const file5 = path.join(dirNameL2, "GULPFILE.js");
    tempFiles.push(file5);


    await fsApi.writeFile(
        file2,
        "const { series } = require('gulp');\n" +
        "function clean(cb) {\n" +
        "    console.log('clean!!!');\n" +
        "    cb();\n" +
        "};\n" +
        "function build(cb) {" +
        "    console.log('build!!!');\n" +
        "    cb();\n" +
        "};\n" +
        "exports.build = build;\n" +
        'exports["clean"] = clean;\n' +
        "exports.default = series(clean, build);\n"
    );

    await fsApi.writeFile(
        file3,
        "var gulp = require('gulp');\n" +
        "gulp.task('hello3', (done) => {\n" +
        "    console.log('Hello3!');\n" +
        "    done();\n" +
        "});\n" +
        'gulp.task(\n"hello4", (done) => {\n' +
        "    console.log('Hello4!');\n" +
        "    done();\n" +
        "});\n"
    );

    await fsApi.writeFile(
        file4,
        "var gulp = require('gulp');\n" +
        "gulp.task('group-test-build-ui-one', (done) => {\n" +
        "    console.log('Hello3!');\n" +
        "    done();\n" +
        "});\n" +
        'gulp.task(\n"group-test-build-ui-two", (done) => {\n' +
        "    console.log('Hello4!');\n" +
        "    done();\n" +
        "});\n" +
        "gulp.task('group-test-build-ui-three', (done) => {\n" +
        "    console.log('Hello3!');\n" +
        "    done();\n" +
        "});\n" +
        "gulp.task('group-test-build-ui-four', (done) => {\n" +
        "    console.log('Hello3!');\n" +
        "    done();\n" +
        "});\n" +
        "gulp.task('group-test-build-ui-five', (done) => {\n" +
        "    console.log('Hello3!');\n" +
        "    done();\n" +
        "});\n"
    );

    await fsApi.writeFile(
        file5,
        "var gulp = require('gulp');\n" +
        "gulp.task('group2-test2-build-ui-one', (done) => {\n" +
        "    console.log('Hello1!');\n" +
        "    done();\n" +
        "});\n" +
        'gulp.task(\n"group2-test2-build-ui-two", (done) => {\n' +
        "    console.log('Hello2!');\n" +
        "    done();\n" +
        "});\n" +
        "gulp.task('group2-test2-build-ui-three', (done) => {\n" +
        "    console.log('Hello3!');\n" +
        "    done();\n" +
        "});\n" +
        "gulp.task('group2-test2-build-ui-four', (done) => {\n" +
        "    console.log('Hello4!');\n" +
        "    done();\n" +
        "});\n" +
        "gulp.task('group2-test2-build-ui-five', (done) => {\n" +
        "    console.log('Hello5!');\n" +
        "    done();\n" +
        "});\n"
    );

    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
}


async function setupMakefile()
{
    if (!rootPath || !dirNameIgn || !dirName) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    await createMakeFile();

    const file2 = path.join(dirName, "Makefile");
    tempFiles.push(file2);

    const file3 = path.join(dirNameIgn, "Makefile");
    tempFiles.push(file3);

    await fsApi.writeFile(
        file2,
        "# all tasks comment\n" +
        "all   : temp.exe\r\n" + "    @echo Building app\r\n" + "clean: t1\r\n" + "    rmdir /q /s ../build\r\n"
    );

    await fsApi.writeFile(
        file3,
        "all   : temp.exe\r\n" + "    @echo Building app\r\n" + "clean: t1\r\n" + "    rmdir /q /s ../build\r\n"
    );

    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
}


async function setupBatch()
{
    if (!rootPath || !dirNameIgn || !dirName) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    await createBatchFile();

    const file2 = path.join(dirName, "test2.BAT");
    tempFiles.push(file2);

    const file3 = path.join(dirNameIgn, "test3.bat");
    tempFiles.push(file3);

    await fsApi.writeFile(file2, "@echo testing batch file 2\r\nsleep /t 5\r\n");
    await fsApi.writeFile(file3, "@echo testing batch file 3\r\n");
    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent);
}


async function setupBash()
{
    if (!rootPath || !dirNameIgn || !dirName) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    const file = path.join(rootPath, "test.sh");
    tempFiles.push(file);

    const file2 = path.join(dirName, "test2.SH");
    tempFiles.push(file2);

    const file3 = path.join(dirNameIgn, "test3.sh");
    tempFiles.push(file3);

    await fsApi.writeFile(file, "echo testing bash file\n");
    await fsApi.writeFile(file2, "echo testing bash file 2\n");
    await fsApi.writeFile(file3, "echo testing bash file 3\n");

    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
}


async function setupGrunt()
{
    if (!rootPath || !dirName || !dirNameIgn || !dirNameL2) {
        assert.fail("        ✘ Workspace folder does not exist");
    }

    await createGruntFile();

    const file2 = path.join(dirName, "Gruntfile.js");
    tempFiles.push(file2);

    const file3 = path.join(dirNameIgn, "Gruntfile.js");
    tempFiles.push(file3);

    const file4 = path.join(dirNameL2, "GRUNTFILE.JS");
    tempFiles.push(file4);

    await fsApi.writeFile(
        file2,
        "module.exports = function(grunt) {\n" +
        '    grunt.registerTask(\n"default2", ["jshint:myproject"]);\n' +
        '    grunt.registerTask("upload2", ["s3"]);\n' +
        "};\n"
    );

    await fsApi.writeFile(
        file3,
        "module.exports = function(grunt) {\n" +
        '    grunt.registerTask(\n"default3", ["jshint:myproject"]);\n' +
        '    grunt.registerTask("upload3", ["s3"]);\n' +
        "};\n"
    );

    await fsApi.writeFile(
        file4,
        "module.exports = function(grunt) {\n" +
        '    grunt.registerTask("grp-test-svr-build1", ["s1"]);\n' +
        '    grunt.registerTask("grp-test-svr-build2", ["s2"]);\n' +
        "};\n"
    );

    await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
}


async function setupAppPublisher()
{
    if (!rootPath) {
        assert.fail("        ✘ Workspace folder does not exist");
    }
    await createAppPublisherFile();
}


async function setupMaven()
{
    if (!rootPath) {
        assert.fail("        ✘ Workspace folder does not exist");
    }
    await createMavenPomFile();
}


async function createAntFile()
{
    if (dirName)
    {
        const file = path.join(dirName, "build.xml");
        tempFiles.push(file);

        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(
                file,
                '<?xml version="1.0"?>\n' +
                '<project basedir="." default="test1">\n' +
                '    <property environment="env" />\n' +
                '    <property name="test" value="test" />\n' +
                '    <target name="test1" depends="init"></target>\n' +
                '    <target name="test2" depends="init"></target>\n' +
                "</project>\n"
            );
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}


async function createAppPublisherFile()
{
    if (rootPath)
    {
        const file = path.join(rootPath, ".publishrc.json");
        tempFiles.push(file);

        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(
                file,
                "{\n" +
                '    "version": "1.0.0",\n' +
                '    "branch": "trunk",\n' +
                '    "buildCommand": [],\n' +
                '    "mantisbtRelease": "Y",\n' +
                '    "mantisbtChglogEdit": "N",\n' +
                '    "mantisbtProject": "",\n' +
                '    "repoType": "svn"\n' +
                "}\n"
            );
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}


async function createMavenPomFile()
{
    if (rootPath)
    {
        const file = path.join(rootPath, "pom.xml");
        tempFiles.push(file);

        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(
                file,
                "<project xmlns=\"http://maven.apache.org/POM/4.0.0\">\n" +
                "    <modelVersion>4.0.0</modelVersion>\n" +
                "</project>\n"
            );
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}


async function createBatchFile()
{
    if (rootPath)
    {
        const file = path.join(rootPath, "test.bat");
        tempFiles.push(file);
        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(file, "@echo testing batch file\r\n");
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}


async function createGradleFile()
{
    if (dirName)
    {
        const file = path.join(dirName, "build.gradle");
        tempFiles.push(file);

        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(
                file,
                "task fatJar(type: Jar) {\n" +
                "    manifest {\n" +
                "        attributes 'Implementation-Title': 'Gradle Jar File Example',\n" +
                "            'Implementation-Version': version,\n" +
                "            'Main-Class': 'com.spmeesseman.test'\n" +
                "    }\n" +
                "    baseName = project.name + '-all'\n" +
                "    from { configurations.compile.collect { it.isDirectory() ? it : zipTree(it) } }\n" +
                "    with jar\n" +
                "}\n"
            );
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}


async function createGruntFile()
{
    if (rootPath)
    {
        const file = path.join(rootPath, "GRUNTFILE.js");
        tempFiles.push(file);

        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(
                file,
                "module.exports = function(grunt) {\n" +
                "    grunt.registerTask(\n'default', ['jshint:myproject']);\n" +
                '    grunt.registerTask("upload", [\'s3\']);\n' +
                "};\n"
            );
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}


async function createGulpFile()
{
    if (rootPath)
    {
        const file = path.join(rootPath, "gulpfile.js");
        tempFiles.push(file);

        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(
                file,
                "var gulp = require('gulp');\n" +
                "gulp.task(\n'hello', (done) => {\n" +
                "    console.log('Hello!');\n" +
                "    done();\n" +
                "});\n" +
                'gulp.task(\n       "hello2", (done) => {\n' +
                "    done();\n" +
                "});\n"
            );
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}


async function createMakeFile()
{
    if (rootPath)
    {
        const file = path.join(rootPath, "Makefile");
        tempFiles.push(file);

        if (!await fsApi.pathExists(file))
        {
            await fsApi.writeFile(
                file,
                "all   : temp.exe\r\n" + "    @echo Building app\r\n" + "clean: t1\r\n" + "    rmdir /q /s ../build\r\n"
            );
            await teApi.waitForIdle(testControl.waitTime.fsCreateEvent, 3000);
        }
    }
}

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TaskExecution } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITaskItem, ITeWrapper, ITeWebview } from "@spmeesseman/vscode-taskexplorer-types";
import { closeTeWebviewPanel, executeSettingsUpdate, executeTeCommand, executeTeCommand2, showTeWebview } from "../../utils/commandUtils";
import {
	activate, closeEditors, testControl as tc, suiteFinished, sleep, exitRollingCount,
	endRollingCount, treeUtils, waitForTaskExecution, waitForWebviewsIdle
} from "../../utils/utils";

let teWrapper: ITeWrapper;
let ant: ITaskItem[];
let antTask: ITaskItem;
let batch: ITaskItem[];
let python: ITaskItem[];
let gulp: ITaskItem[];
let gulpTask: ITaskItem;
let teWebview: ITeWebview;


suite("Task Details Page Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate(this));
		await teWrapper.config.update(teWrapper.keys.Config.KeepTerminalOnTaskDone, true);
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		await closeEditors();
        suiteFinished(this);
	});


	test("Focus Explorer View", async function()
	{
        await startupFocus(this);
	});


	test("Open Details Page (Used Task Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetailsScript + tc.slowTime.tasks.getTreeTasks + tc.slowTime.webview.closeSync + 50);
		batch = await treeUtils.getTreeTasks(teWrapper, "batch", 2);
		teWebview = await showTeWebview("taskDetails", batch[0]);
		await closeTeWebviewPanel(teWebview);
		await sleep(25);
        endRollingCount(this);
	});


	test("Open Details Page (Used Task Non-Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetailsNonScript + tc.slowTime.tasks.getTreeTasks + tc.slowTime.commands.standard + tc.slowTime.commands.fast);
		ant = await treeUtils.getTreeTasks(teWrapper, "ant", 3);
		antTask = ant.find(t => t.taskFile.fileName.includes("hello.xml")) as ITaskItem;
		teWebview = await showTeWebview("taskDetails", antTask);
		const curLogLvl = teWrapper.config.get<number>("teWrapper.keys.Config.LogLevel", 1);
		await executeSettingsUpdate(teWrapper.keys.Config.LogLevel, curLogLvl + 1, tc.slowTime.commands.standard); // cover taskEDetails onConfigChange else path
        void executeSettingsUpdate(teWrapper.keys.Config.LogLevel, curLogLvl, tc.slowTime.commands.standard);     // cover taskEDetails onConfigChange else path
		await sleep(1);
        endRollingCount(this);
	});


	test("Run Task w/ Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runStop + tc.slowTime.commands.standard + 2400);
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ antTask ], tc.waitTime.runCommandMin);
        await waitForTaskExecution(exec, 800);
		await executeTeCommand2("stop", [ antTask ], tc.waitTime.taskCommand);
        await waitForTaskExecution(exec, 300);
		await sleep(100); // allow task status event to propagate to webviews via postMessage
		await closeTeWebviewPanel(teWebview);
		await executeTeCommand2("taskexplorer.setPinned", [ antTask ]);
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetailsScript + tc.slowTime.tasks.getTreeTasks + tc.slowTime.webview.closeSync);
		python = await treeUtils.getTreeTasks(teWrapper, "python", 2);
		teWebview = await showTeWebview("taskDetails", python[0]);
		await closeTeWebviewPanel(teWebview);
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task Non-Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetailsNonScript + tc.slowTime.tasks.getTreeTasks + tc.slowTime.commands.standard);
		gulp = await treeUtils.getTreeTasks(teWrapper, "gulp", 14);
		gulpTask = gulp.find(t => t.taskFile.fileName.includes("gulpfile.js") && (<string>t.label).includes("build33")) as ITaskItem;
		teWebview = await showTeWebview("taskDetails", gulpTask);
		await executeTeCommand2("taskexplorer.setPinned", [ gulpTask ]);
        endRollingCount(this);
	});


	test("Run Unused Task 1 w/ Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.gulpTask + tc.slowTime.commands.run + tc.slowTime.webview.closeSync + 200);
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ gulpTask ], tc.waitTime.runCommandMin) ;
        await waitForTaskExecution(exec, tc.slowTime.tasks.gulpTask);
		await sleep(100); // allow task status event to propagate to webviews via postMessage
        endRollingCount(this);
	});


	test("Run Unused Task 2 w/o Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.gulpTask + tc.slowTime.commands.run + tc.slowTime.commands.standard);
		await executeTeCommand2("taskexplorer.setPinned", [ gulpTask ]);
		gulpTask = gulp.find(t => t.taskFile.fileName.includes("GULPFILE.js") && (<string>t.label).includes("test")) as ITaskItem;
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ gulpTask ], tc.waitTime.runCommandMin) ;
        await waitForTaskExecution(exec, tc.slowTime.tasks.gulpTask);
		await executeTeCommand2("taskexplorer.setPinned", [ gulpTask ]);
        endRollingCount(this);
	});


	test("Close Open Pages", async function()
	{
        if (exitRollingCount(this)) return;
		await closeTeWebviewPanel(teWebview);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (From App)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetailsScript + tc.slowTime.webview.closeSync);
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ batch[0].task ], "all")[0]; // App uses ITeTask
		teWebview = await showTeWebview("taskDetails", iTask);
		await closeTeWebviewPanel(teWebview);
        endRollingCount(this);
	});


	test("Open Details Page (Tracking Disabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.config.trackingEvent * 4) + tc.slowTime.webview.show.page.taskDetailsScript + tc.slowTime.webview.closeSync + 200);
		teWebview = await showTeWebview("taskDetails", python[0]);
		await sleep(1);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, false);
		await sleep(100);
        await waitForWebviewsIdle();
		await closeTeWebviewPanel(teWebview);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, true);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true);
        endRollingCount(this);
	});

});

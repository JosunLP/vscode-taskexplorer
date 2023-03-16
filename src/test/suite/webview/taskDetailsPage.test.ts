/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TaskExecution } from "vscode";
import { startupFocus } from "../../utils/suiteUtils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { executeSettingsUpdate, executeTeCommand2, showTeWebview } from "../../utils/commandUtils";
import {
	activate, closeEditors, testControl as tc, suiteFinished, sleep, exitRollingCount,
	endRollingCount, treeUtils, waitForTaskExecution
} from "../../utils/utils";

let teWrapper: ITeWrapper;
let ant: ITaskItem[];
let antTask: ITaskItem;
let batch: ITaskItem[];
let python: ITaskItem[];
let gulp: ITaskItem[];
let gulpTask: ITaskItem;


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
		this.slow(tc.slowTime.webview.show.page.taskDetails + tc.slowTime.tasks.getTreeTasks);
		batch = await treeUtils.getTreeTasks(teWrapper, "batch", 2);
		await showTeWebview("taskDetails", batch[0]);
        endRollingCount(this);
	});


	test("Open Details Page (Used Task Non-Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetails + tc.slowTime.tasks.getTreeTasks);
		ant = await treeUtils.getTreeTasks(teWrapper, "ant", 3);
		antTask = ant.find(t => t.taskFile.fileName.includes("hello.xml")) as ITaskItem;
		await showTeWebview("taskDetails", antTask);
        endRollingCount(this);
	});


	test("Run Task w/ Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.commands.run + tc.slowTime.commands.runStop + 2300);
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ antTask ], tc.waitTime.runCommandMin);
        await waitForTaskExecution(exec, 800);
		await executeTeCommand2("stop", [ antTask ], tc.waitTime.taskCommand);
        await waitForTaskExecution(exec, 300);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetails + tc.slowTime.tasks.getTreeTasks + tc.slowTime.general.closeEditors);
		python = await treeUtils.getTreeTasks(teWrapper, "python", 2);
		await showTeWebview("taskDetails", python[0]);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task Non-Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetails + tc.slowTime.tasks.getTreeTasks);
		gulp = await treeUtils.getTreeTasks(teWrapper, "gulp", 14);
		gulpTask = gulp.find(t => t.taskFile.fileName.includes("gulpfile.js") && (<string>t.label).includes("build33")) as ITaskItem;
		await showTeWebview("taskDetails", gulpTask);
        endRollingCount(this);
	});


	test("Run Unused Task w/ Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.gulpTask + tc.slowTime.commands.run);
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ gulpTask ], tc.waitTime.runCommandMin) ;
        await waitForTaskExecution(exec, tc.slowTime.tasks.gulpTask);
		await closeEditors();
        endRollingCount(this);
	});


	test("Run Unused Task w/o Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.gulpTask + tc.slowTime.commands.run);
		gulpTask = gulp.find(t => t.taskFile.fileName.includes("GULPFILE.js") && (<string>t.label).includes("test")) as ITaskItem;
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ gulpTask ], tc.waitTime.runCommandMin) ;
        await waitForTaskExecution(exec, tc.slowTime.tasks.gulpTask);
        endRollingCount(this);
	});


	test("Open Details Page (From App)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.webview.show.page.taskDetails);
		const iTask = teWrapper.taskUtils.toITask(teWrapper, [ batch[0].task ], "all")[0]; // App uses ITeTask
		await showTeWebview("taskDetails", iTask);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Tracking Disabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.config.event * 4) + tc.slowTime.webview.show.page.taskDetails + tc.slowTime.general.closeEditors);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, false);
		await showTeWebview("taskDetails", python[0]);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, true);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true);
		await closeEditors();
        endRollingCount(this);
	});

});

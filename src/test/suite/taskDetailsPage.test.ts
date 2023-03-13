/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TaskExecution } from "vscode";
import { startupFocus } from "../utils/suiteUtils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { executeSettingsUpdate, executeTeCommand2 } from "../utils/commandUtils";
import {
	activate, closeEditors, testControl as tc, suiteFinished, sleep, exitRollingCount,
	endRollingCount, treeUtils, waitForTaskExecution
} from "../utils/utils";

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
		this.slow(tc.slowTime.viewTaskDetails + 150);
		batch = await treeUtils.getTreeTasks(teWrapper, "batch", 2);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ batch[0] ], tc.waitTime.viewWebviewPage);
		await sleep(75);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Used Task Non-Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.viewTaskDetails + 150);
		ant = await treeUtils.getTreeTasks(teWrapper, "ant", 3);
		antTask = ant.find(t => t.taskFile.fileName.includes("hello.xml")) as ITaskItem;
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ antTask ], tc.waitTime.viewWebviewPage);
		await sleep(75);
        endRollingCount(this);
	});


	test("Run Task w/ Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow((tc.slowTime.config.event * 2) + tc.slowTime.tasks.antTask + 1900 + tc.slowTime.commands.run);
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false); // for coverage
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ antTask ], tc.waitTime.runCommandMin) ;
        await sleep(50);
        await waitForTaskExecution(exec, 600);
		await executeTeCommand2("stop", [ antTask ], tc.waitTime.taskCommand);
        await waitForTaskExecution(exec, 300);
        await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true); // for coverage ^^^
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.viewTaskDetails + 150);
		python = await treeUtils.getTreeTasks(teWrapper, "python", 2);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ python[0] ], tc.waitTime.viewWebviewPage);
		await sleep(75);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task Non-Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.viewTaskDetails + 10);
		gulp = await treeUtils.getTreeTasks(teWrapper, "gulp", 14);
		gulpTask = gulp.find(t => t.taskFile.fileName.includes("gulpfile.js") && (<string>t.label).includes("build33")) as ITaskItem;
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ gulpTask ], tc.waitTime.viewWebviewPage);
		await sleep(5);
        endRollingCount(this);
	});


	test("Run Unused Task w/ Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.gulpTask + 20 + tc.slowTime.commands.run);
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ gulpTask ], tc.waitTime.runCommandMin) ;
        await waitForTaskExecution(exec);
		await sleep(10);
		await closeEditors();
        endRollingCount(this);
	});


	test("Run Unused Task w/o Details Page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.tasks.gulpTask + 20 + tc.slowTime.commands.run);
		gulpTask = gulp.find(t => t.taskFile.fileName.includes("GULPFILE.js") && (<string>t.label).includes("test")) as ITaskItem;
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ gulpTask ], tc.waitTime.runCommandMin) ;
        await waitForTaskExecution(exec);
		await sleep(10);
        endRollingCount(this);
	});


	test("Open Details Page (From App)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(tc.slowTime.viewTaskDetails + 150);
		python = await treeUtils.getTreeTasks(teWrapper, "python", 2);
		const iTasks = teWrapper.taskUtils.toITask(teWrapper, [ batch[0].task ], "all"); // App uses ITeTask
		await executeTeCommand2("taskexplorer.view.taskDetails.show", iTasks, tc.waitTime.viewWebviewPage);
		await sleep(75);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Tracking Disabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((tc.slowTime.config.event * 4) + tc.slowTime.viewTaskUsageView + tc.slowTime.viewTaskDetails + 150 + tc.slowTime.closeEditors);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, false);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, false);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ python[0] ], tc.waitTime.viewWebviewPage);
		await teWrapper.taskUsageView.show();
		await sleep(75);
		await executeSettingsUpdate(teWrapper.keys.Config.TrackUsage, true);
		await executeSettingsUpdate(teWrapper.keys.Config.TaskMonitor.TrackStats, true);
		await closeEditors();
        endRollingCount(this);
	});

});

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { ConfigKeys } from "../../lib/constants";
import { startupFocus } from "../utils/suiteUtils";
import { ITaskItem, ITeWrapper } from "@spmeesseman/vscode-taskexplorer-types";
import { executeSettingsUpdate, executeTeCommand2 } from "../utils/commandUtils";
import {
	activate, closeEditors, testControl, suiteFinished, sleep, exitRollingCount,
	endRollingCount, treeUtils, waitForTaskExecution
} from "../utils/utils";
import { TaskExecution } from "vscode";

let teWrapper: ITeWrapper;
let ant: ITaskItem[];
let antTask: ITaskItem;
let batch: ITaskItem[];
let python: ITaskItem[];


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
		this.slow(testControl.slowTime.viewTaskDetails + 150);
		batch = await treeUtils.getTreeTasks(teWrapper, "batch", 2);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ batch[0] ], testControl.waitTime.viewReport);
		await sleep(75);
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Used Task Non-Script Type)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewTaskDetails + 150);
		ant = await treeUtils.getTreeTasks(teWrapper, "ant", 3);
		antTask = ant.find(t => t.taskFile.fileName.includes("hello.xml")) as ITaskItem;
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ antTask ], testControl.waitTime.viewReport);
		await sleep(75);
        endRollingCount(this);
	});


	test("Run Task With Details page Open", async function()
	{
        if (exitRollingCount(this)) return;
        this.slow((testControl.slowTime.config.event * 2) + testControl.slowTime.tasks.antTask + 300);
        await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, false); // for coverage
		const exec = await executeTeCommand2<TaskExecution | undefined>("run", [ antTask ], testControl.waitTime.runCommandMin) ;
        await sleep(150);
        await waitForTaskExecution(exec, 1000);
		await executeTeCommand2("stop", [ antTask ], testControl.waitTime.taskCommand);
        await waitForTaskExecution(exec, 500);
        await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, true); // for coverage ^^^
		await closeEditors();
        endRollingCount(this);
	});


	test("Open Details Page (Unused Task)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.viewTaskDetails + 150);
		python = await treeUtils.getTreeTasks(teWrapper, "python", 2);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ python[0] ], testControl.waitTime.viewReport);
		await sleep(75);
		await closeEditors();
        endRollingCount(this);
	});



	test("Open Details Page (Tracking Disabled)", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 4) + testControl.slowTime.viewTaskDetails + 150);
		await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, false);
		await executeSettingsUpdate(ConfigKeys.TrackUsage, false);
		await executeTeCommand2("taskexplorer.view.taskDetails.show", [ python[0] ], testControl.waitTime.viewReport);
		await teWrapper.taskUsageView.show();
		await sleep(75);
		await executeSettingsUpdate(ConfigKeys.TrackUsage, true);
		await executeSettingsUpdate(ConfigKeys.TaskMonitor.TrackStats, true);
		await closeEditors();
        endRollingCount(this);
	});

});
